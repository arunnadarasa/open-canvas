import { useState, useCallback, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, ComputeBudgetProgram } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import { fetchX402Requirements, verifyX402Payment, buildX402PaymentHeader, type X402PaymentRequirement } from '@/lib/x402';
import { buildMintSkillTransaction, buildVerifySkillTransaction, buildMemoInstruction } from '@/lib/anchor-client';
import { isDSL, validateDSL, DSL_HINT } from '@/lib/skill-dsl';
import { fetchMetadataUri, buildCreateMetadataTransaction } from '@/lib/metaplex';
import { ExternalLink, RefreshCw, AlertTriangle, CheckCircle2, Loader2, Wallet } from 'lucide-react';

const connection = new Connection(import.meta.env.VITE_SOLANA_RPC || 'https://api.devnet.solana.com');
const SOL_AMOUNT_LAMPORTS = 100_000;

type PaymentMethod = 'usdc' | 'sol';

export default function MoveMint({ onMintSuccess, isWorldIDVerified, onRequestVerify }: { onMintSuccess?: (data: { moveName: string; videoHash: string; royalty: number; creator: string; txSignature: string; paymentMethod: 'usdc' | 'sol'; mintPubkey?: string; skillPda?: string; metadataUri?: string; skillJsonUri?: string; skillMdUri?: string; videoHashCid?: string }) => void; isWorldIDVerified?: boolean; onRequestVerify?: () => void }) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [moveName, setMoveName] = useState('');
  const [videoHash, setVideoHash] = useState('');
  const [videoHashCid, setVideoHashCid] = useState('');
  const [royalty, setRoyalty] = useState(5);
  const [status, setStatus] = useState('');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [verifiedContent, setVerifiedContent] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('usdc');

  const paymentReqRef = useRef<X402PaymentRequirement | null>(null);
  const signedTxBase64Ref = useRef<string | null>(null);

  const connectedAddress = user?.wallet?.address || null;
  const isEthereumWallet = connectedAddress && connectedAddress.startsWith('0x');

  const mintMove = useCallback(async () => {
    if (!authenticated) {
      setStatus('Please connect your wallet first.');
      return;
    }

    if (!moveName.trim() || !videoHash.trim()) {
      setStatus('Please fill in all fields.');
      return;
    }

    const dslError = validateDSL(videoHash);
    if (dslError) {
      setStatus(`❌ DSL Error: ${dslError}`);
      return;
    }

    const walletAddress = user?.wallet?.address;
    if (!walletAddress) {
      setStatus('Wallet address not available.');
      return;
    }
    if (walletAddress.startsWith('0x')) {
      setStatus('Please connect a Solana wallet, not Ethereum.');
      return;
    }

    let fromPubkey: PublicKey;
    try {
      fromPubkey = new PublicKey(walletAddress);
    } catch {
      setStatus(`Invalid Solana address: ${walletAddress}`);
      return;
    }

    const phantom = (window as any).solana;
    if (!phantom?.signTransaction) {
      setStatus('Phantom wallet not available for signing.');
      return;
    }

    try {
      // Step 1: Mint on-chain via Anchor program
      setStatus('Building on-chain mint transaction...');
      const { transaction: mintTx, mintKeypair, skillPDA, treasuryPDA } = await buildMintSkillTransaction(
        connection,
        fromPubkey,
        moveName,
        videoHash,
        royalty,
      );

      // Partially sign with the mint keypair
      mintTx.partialSign(mintKeypair);

      setStatus('Please sign the mint transaction in your wallet...');
      const signedMintTx = await phantom.signTransaction(mintTx);
      const serializedMintTx = signedMintTx.serialize();

      setStatus('Broadcasting mint transaction...');
      const mintSignature = await connection.sendRawTransaction(serializedMintTx);
      await connection.confirmTransaction(mintSignature);

      setTxSignature(mintSignature);
      setStatus(`✅ On-chain mint confirmed! Tx: ${mintSignature.slice(0, 8)}... Attaching metadata...`);

      // Step 2: Create Metaplex NFT metadata
      let metadataUri = '';
      try {
        setStatus('Generating NFT metadata & OpenClaw skill package...');
        const metaResult = await fetchMetadataUri({
          moveName,
          description: `Dance move NFT: ${moveName}`,
          videoHash,
          creator: fromPubkey.toBase58(),
          royaltyPercent: royalty,
          mintPubkey: mintKeypair.publicKey.toBase58(),
          videoHashCid: videoHashCid || undefined,
        });
        metadataUri = metaResult.uri;
        const skillJsonUri = metaResult.skillJsonUri;
        const skillMdUri = metaResult.skillMdUri;

        // Store skill URIs for later use
        (window as any).__lastSkillJsonUri = skillJsonUri;
        (window as any).__lastSkillMdUri = skillMdUri;

        setStatus('Building Metaplex metadata transaction...');
        const web3Tx = await buildCreateMetadataTransaction({
          mintPublicKey: mintKeypair.publicKey,
          creatorPublicKey: fromPubkey,
          name: moveName,
          uri: metadataUri,
          sellerFeeBasisPoints: royalty * 100,
        });

        web3Tx.partialSign(mintKeypair);
        setStatus('Please sign the metadata transaction in your wallet...');
        const signedMetaTx = await phantom.signTransaction(web3Tx);
        const serializedMetaTx = signedMetaTx.serialize();

        setStatus('Broadcasting metadata transaction...');
        const metaSig = await connection.sendRawTransaction(serializedMetaTx);
        await connection.confirmTransaction(metaSig);
        setStatus(`✅ Metadata attached! Now processing payment...`);
      } catch (metaErr: any) {
        console.warn('Metaplex metadata step failed:', metaErr);
        setStatus(`⚠️ Metadata attachment failed (${metaErr.message?.slice(0, 60)}). Continuing with payment...`);
      }

      // Step 3: Handle payment (x402 USDC or SOL)
      if (paymentMethod === 'usdc') {
        await handleUSDCPayment(fromPubkey, phantom, skillPDA, mintKeypair.publicKey.toBase58(), skillPDA.toBase58(), mintSignature, metadataUri);
      } else {
        await handleSOLPayment(fromPubkey, phantom, mintKeypair.publicKey.toBase58(), skillPDA.toBase58(), mintSignature, metadataUri);
      }
    } catch (error: any) {
      console.error('Mint error:', error);
      setStatus(`❌ Error: ${error.message || 'Unknown error'}`);
    }
  }, [authenticated, moveName, videoHash, royalty, user, paymentMethod]);

  const handleSOLPayment = async (fromPubkey: PublicKey, phantom: any, mintPubkey: string, skillPda: string, mintSignature: string, metadataUri?: string) => {
    setStatus('Preparing SOL payment...');
    const paymentReq = await fetchX402Requirements();
    const recipientPubkey = new PublicKey(paymentReq.to);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: recipientPubkey,
        lamports: SOL_AMOUNT_LAMPORTS,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    setStatus('Please sign the SOL payment in your wallet...');
    const signedTx = await phantom.signTransaction(transaction);
    const serializedTx = signedTx.serialize();

    setStatus('Broadcasting SOL payment...');
    const signature = await connection.sendRawTransaction(serializedTx);
    await connection.confirmTransaction(signature);

    setVerifiedContent({ message: 'SOL payment confirmed on-chain' });
    setStatus(`✅ Move "${moveName}" minted and paid! SOL tx: ${signature.slice(0, 8)}...`);
    onMintSuccess?.({ moveName, videoHash, royalty, creator: fromPubkey.toBase58(), txSignature: mintSignature, paymentMethod: 'sol', mintPubkey, skillPda, metadataUri, skillJsonUri: (window as any).__lastSkillJsonUri, skillMdUri: (window as any).__lastSkillMdUri, videoHashCid: videoHashCid || undefined });
  };

  const handleUSDCPayment = async (fromPubkey: PublicKey, phantom: any, skillPDA: PublicKey, mintPubkey: string, skillPda: string, mintSignature: string, metadataUri?: string) => {
    setStatus('Fetching x402 payment requirements...');
    const paymentReq = await fetchX402Requirements();
    paymentReqRef.current = paymentReq;

    setStatus(`Payment required: ${paymentReq.amount} ${paymentReq.tokenSymbol}`);

    const usdcMint = new PublicKey(paymentReq.token);
    const recipientPubkey = new PublicKey(paymentReq.to);
    const amount = Math.round(parseFloat(paymentReq.rawAmount));
    const facilitatorPubkey = new PublicKey(paymentReq.extra.feePayer as string);

    const senderATA = await getAssociatedTokenAddress(usdcMint, fromPubkey);
    const recipientATA = await getAssociatedTokenAddress(usdcMint, recipientPubkey);

    const transaction = new Transaction();

    try {
      await getAccount(connection, recipientATA);
    } catch {
      transaction.add(createAssociatedTokenAccountInstruction(fromPubkey, recipientATA, recipientPubkey, usdcMint));
    }

    try {
      const senderAccount = await getAccount(connection, senderATA);
      if (Number(senderAccount.amount) < amount) {
        throw new Error(`Insufficient USDC balance. You need ${paymentReq.amount} USDC (devnet).`);
      }
    } catch (e: any) {
      if (e.message?.includes('Insufficient')) throw e;
      throw new Error('No USDC token account found. You need devnet USDC in your wallet.');
    }

    transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 10_000 }));
    transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }));
    transaction.add(createTransferCheckedInstruction(senderATA, usdcMint, recipientATA, fromPubkey, amount, 6));

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = facilitatorPubkey;

    setStatus(`Please sign the ${paymentReq.amount} ${paymentReq.tokenSymbol} payment...`);
    const signedTx = await phantom.signTransaction(transaction);
    const serializedTx = signedTx.serialize({ requireAllSignatures: false });
    const signedTxBase64 = Buffer.from(serializedTx).toString('base64');
    signedTxBase64Ref.current = signedTxBase64;

    setStatus('Sending to x402 facilitator for verification...');

    try {
      const verified = await verifyX402Payment(signedTxBase64, paymentReq);
      setVerifiedContent(verified);
      if (verified.tx_hash) setTxSignature(verified.tx_hash);

      // After x402 verification, call verify_skill + embed memo proof on-chain
      setStatus('Verifying move on-chain with payment proof...');
      try {
        const verifyTx = await buildVerifySkillTransaction(connection, fromPubkey, skillPDA);
        // Embed x402 proof-of-payment as a Memo instruction
        if (verified.tx_hash) {
          verifyTx.add(buildMemoInstruction(`x402:${verified.tx_hash}`, fromPubkey));
        }
        const signedVerifyTx = await phantom.signTransaction(verifyTx);
        const serializedVerifyTx = signedVerifyTx.serialize();
        const verifySig = await connection.sendRawTransaction(serializedVerifyTx);
        await connection.confirmTransaction(verifySig);
        setStatus(`✅ Move "${moveName}" minted and verified on-chain with payment proof!`);
      } catch (verifyErr: any) {
        console.warn('On-chain verify failed (may already be verified):', verifyErr);
        setStatus(`✅ Move "${moveName}" minted! x402 verified. On-chain verify: ${verifyErr.message?.slice(0, 60)}`);
      }

      onMintSuccess?.({ moveName, videoHash, royalty, creator: fromPubkey.toBase58(), txSignature: mintSignature, paymentMethod: 'usdc', mintPubkey, skillPda, metadataUri, skillJsonUri: (window as any).__lastSkillJsonUri, skillMdUri: (window as any).__lastSkillMdUri, videoHashCid: videoHashCid || undefined });
    } catch (verifyErr: any) {
      const errMsg = typeof verifyErr === 'object' ? (verifyErr.message || JSON.stringify(verifyErr)) : String(verifyErr);
      setStatus(`⚠️ Facilitator verification failed: ${errMsg}`);
    }
  };

  const retryVerification = async () => {
    if (!signedTxBase64Ref.current || !paymentReqRef.current) {
      setStatus('⚠️ Cannot retry: missing signed transaction data. Please mint again.');
      return;
    }
    setStatus('Retrying verification...');
    try {
      const verified = await verifyX402Payment(signedTxBase64Ref.current, paymentReqRef.current);
      setVerifiedContent(verified);
      setStatus(`✅ Payment verified! Move "${moveName}" minted successfully.`);
    } catch (err: any) {
      const errMsg = typeof err === 'object' ? (err.message || JSON.stringify(err)) : String(err);
      setStatus(`⚠️ Verification still pending: ${errMsg || 'Try again in a moment.'}`);
    }
  };

  const isLoading = status && !status.startsWith('✅') && !status.startsWith('❌') && !status.startsWith('⚠️') && status !== '';
  const isSuccess = status.startsWith('✅');
  const isError = status.startsWith('❌');
  const isWarning = status.startsWith('⚠️');

  return (
    <div className="space-y-6">
      {/* World ID gate */}
      {!isWorldIDVerified && (
        <div className="glass-strong rounded-2xl p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">You must verify your identity before connecting a wallet.</p>
        </div>
      )}

      {/* Wallet Connection */}
      {isWorldIDVerified && <div>
        {!authenticated ? (
          <div className="space-y-3">
            <button
              onClick={async () => {
                setIsConnecting(true);
                setStatus('');
                try {
                  const phantom = typeof window !== 'undefined' ? (window as any).solana : null;
                  if (phantom?.isPhantom) {
                    setStatus('Phantom detected. Please approve the connection in Phantom...');
                  } else {
                    setStatus('⚠️ Phantom wallet not detected. Please install Phantom extension.');
                    setIsConnecting(false);
                    return;
                  }
                  await login();
                  setIsConnecting(false);
                } catch (error: any) {
                  console.error('Wallet connection error:', error);
                  setStatus(`❌ Connection failed: ${error.message || 'Please ensure Phantom is installed and unlocked'}`);
                  setIsConnecting(false);
                }
              }}
              disabled={isConnecting || !ready}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 btn-shimmer bg-[length:200%_auto]"
            >
              <Wallet className="w-5 h-5" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
            {typeof window !== 'undefined' && !(window as any).solana?.isPhantom && (
              <p className="flex items-center gap-1.5 text-sm text-yellow-400/80">
                <AlertTriangle className="w-4 h-4" />
                Phantom wallet not detected. Please install Phantom extension.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-mono">
              {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
            </span>
            <button
              onClick={() => logout()}
              className="px-4 py-2 rounded-xl text-sm border border-white/10 bg-white/5 hover:bg-white/10 text-foreground transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>}

      {isWorldIDVerified && !authenticated ? (
        <p className="text-center text-muted-foreground text-sm">
          Connect your wallet to mint a dance move NFT on Solana devnet.
        </p>
      ) : isEthereumWallet ? (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 space-y-3">
          <p className="font-semibold text-yellow-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Ethereum Wallet Detected
          </p>
          <p className="text-sm text-foreground/80">
            You're connected with an Ethereum wallet ({connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}).
            This dApp requires a <strong className="text-foreground">Solana wallet</strong>.
          </p>
          <ol className="text-sm text-foreground/70 list-decimal pl-5 space-y-1">
            <li>Open your Phantom wallet extension</li>
            <li>Click the network selector at the top</li>
            <li>Switch from "Sepolia" to <strong className="text-foreground">Devnet</strong> (Solana)</li>
            <li>Disconnect and reconnect here</li>
          </ol>
          <button
            onClick={() => logout()}
            className="px-4 py-2 rounded-xl text-sm border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
          >
            Disconnect & Switch to Solana
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); mintMove(); }} className="space-y-5">
          {/* Move Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground/90">Move Name</label>
            <input
              type="text"
              value={moveName}
              onChange={(e) => setMoveName(e.target.value)}
              placeholder="e.g., 'Asura's Signature Chest Pop'"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>

          {/* Expression / DSL */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground/90">Expression or Choreography DSL</label>
            <textarea
              value={videoHash}
              onChange={(e) => setVideoHash(e.target.value)}
              placeholder={`IPFS CID, text description, or conditional DSL:\ndance:chest_pop if sentiment > 0.8\ndance:wave if proximity < 2.0\ndance:idle otherwise`}
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-mono text-sm resize-y"
            />
            {/* Example DSL snippets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground/60">Try an example:</span>
              {[
                { label: 'Sentiment Split', value: 'dance:chest_pop if sentiment > 0.8\ndance:wave if sentiment <= 0.8\ndance:idle otherwise' },
                { label: 'Proximity React', value: 'dance:wave if proximity < 2.0\ndance:bow if proximity >= 2.0\ndance:idle otherwise' },
                { label: 'Energy Burst', value: 'dance:chest_pop if energy > 0.7\ndance:sway if energy <= 0.7\ndance:idle otherwise' },
                { label: 'Plain IPFS CID', value: 'QmExampleCID1234567890abcdef' },
              ].map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => setVideoHash(ex.value)}
                  className="text-xs glass rounded-full px-2 py-1 cursor-pointer hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {ex.label}
                </button>
              ))}
            </div>
            {isDSL(videoHash) && (
              <p className="text-xs text-primary/80">✓ Conditional DSL detected — conditions will be embedded in skill.json</p>
            )}
            {validateDSL(videoHash) && (
              <p className="text-xs text-destructive">{validateDSL(videoHash)}</p>
            )}
            <details className="text-xs text-muted-foreground/50">
              <summary className="cursor-pointer hover:text-muted-foreground/80 transition-colors">DSL syntax help</summary>
              <pre className="mt-1 whitespace-pre-wrap">{DSL_HINT}</pre>
            </details>
          </div>

          {/* Video Hash CID (optional) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground/90">Video Hash (optional)</label>
            <input
              type="text"
              value={videoHashCid}
              onChange={(e) => setVideoHashCid(e.target.value)}
              placeholder="QmXyz... or IPFS video CID"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-mono text-sm"
            />
          </div>

          {/* Royalty Slider */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground/90">
              Royalty Percentage: <span className="gradient-text font-bold">{royalty}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={royalty}
              onChange={(e) => setRoyalty(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
            />
          </div>

          {/* Payment Method Toggle */}
          <div className="glass rounded-xl p-4 space-y-3">
            <label className="block text-sm font-medium text-foreground/90">Payment Method</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('usdc')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                  paymentMethod === 'usdc'
                    ? 'bg-primary/15 border-2 border-primary text-primary shadow-[0_0_15px_-5px_hsl(var(--primary)/0.4)]'
                    : 'border border-white/10 text-muted-foreground hover:bg-white/5'
                }`}
              >
                💵 USDC (x402)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('sol')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                  paymentMethod === 'sol'
                    ? 'bg-secondary/15 border-2 border-secondary text-secondary shadow-[0_0_15px_-5px_hsl(var(--secondary)/0.4)]'
                    : 'border border-white/10 text-muted-foreground hover:bg-white/5'
                }`}
              >
                ◎ SOL (Direct)
              </button>
            </div>
            <p className="text-xs text-muted-foreground/60">
              {paymentMethod === 'usdc'
                ? 'Pay $0.01 USDC via x402 protocol with on-chain verification'
                : 'Pay 0.0001 SOL directly (devnet) — no x402 verification'}
            </p>
          </div>

          {/* Mint Button */}
          <button
            type="submit"
            disabled={!moveName || !videoHash}
            className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed btn-shimmer bg-[length:200%_auto] ${
              paymentMethod === 'sol'
                ? 'bg-gradient-to-r from-[hsl(var(--gradient-solana-purple))] to-[hsl(var(--gradient-solana-green))] hover:shadow-[0_0_40px_-8px_hsl(var(--gradient-solana-purple)/0.5)]'
                : 'bg-gradient-to-r from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] hover:shadow-[0_0_40px_-8px_hsl(var(--primary)/0.5)]'
            }`}
          >
            {paymentMethod === 'usdc'
              ? 'Mint Move NFT (x402 · $0.01 USDC)'
              : 'Mint Move NFT (◎ 0.0001 SOL)'}
          </button>
        </form>
      )}

      {/* Status Display */}
      {status && (
        <div className={`rounded-xl p-5 border transition-all duration-300 ${
          isSuccess ? 'bg-[hsl(var(--gradient-cyan))]/5 border-primary/30' :
          isError ? 'bg-destructive/5 border-destructive/30' :
          isWarning ? 'bg-yellow-500/5 border-yellow-500/30' :
          'glass'
        }`}>
          <div className="flex items-start gap-3">
            {isLoading && <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0 mt-0.5" />}
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />}
            {isError && <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />}
            {isWarning && <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />}
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{status}</p>
          </div>

          {txSignature && (
            <a
              href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on Solscan Devnet
            </a>
          )}

          {txSignature && !verifiedContent && paymentMethod === 'usdc' && (
            <button
              onClick={retryVerification}
              className="mt-3 ml-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Verification
            </button>
          )}

          {verifiedContent && (
            <p className="mt-3 text-sm text-primary font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {paymentMethod === 'usdc' ? 'x402 verified ✓' : 'On-chain confirmed ✓'}
            </p>
          )}
        </div>
      )}

      {/* Debug Panel */}
      {signedTxBase64Ref.current && paymentReqRef.current && (
        <details className="rounded-xl glass overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer text-xs text-muted-foreground/50 font-mono hover:text-muted-foreground/80 transition-colors">
            🔍 Payment Header Debug
          </summary>
          <div className="px-4 pb-4 text-xs font-mono whitespace-pre-wrap break-all max-h-72 overflow-auto text-muted-foreground/60">
            <p className="mb-2 font-semibold text-primary">Decoded PAYMENT-SIGNATURE payload:</p>
            {(() => {
              try {
                const url = import.meta.env.VITE_X402_ENDPOINT || 'https://x402.payai.network/api/solana-devnet/paid-content';
                const header = buildX402PaymentHeader(signedTxBase64Ref.current!, paymentReqRef.current!, url);
                const decoded = JSON.parse(atob(header));
                return <pre className="m-0">{JSON.stringify(decoded, null, 2)}</pre>;
              } catch {
                return <span>Could not decode header</span>;
              }
            })()}
            <p className="mt-4 mb-2 font-semibold text-secondary">Raw 402 requirements:</p>
            <pre className="m-0">{JSON.stringify(paymentReqRef.current, null, 2)}</pre>
          </div>
        </details>
      )}

      <p className="text-xs text-muted-foreground/50 text-center">
        {paymentMethod === 'usdc'
          ? 'Minting uses x402 payment protocol — $0.01 USDC on Solana Devnet. You need devnet USDC in your Phantom wallet.'
          : 'Minting with native SOL — 0.0001 SOL on Solana Devnet. Get free devnet SOL from a faucet.'}
      </p>
    </div>
  );
}
