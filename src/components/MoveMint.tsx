import { useState, useCallback, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import { fetchX402Requirements, verifyX402Payment, buildX402PaymentHeader, type X402PaymentRequirement } from '@/lib/x402';

const connection = new Connection(import.meta.env.VITE_SOLANA_RPC || 'https://api.devnet.solana.com');

// Devnet SOL equivalent for $0.01 USDC (SOL is free on devnet, so this is symbolic)
const SOL_AMOUNT_LAMPORTS = 100_000; // 0.0001 SOL

type PaymentMethod = 'usdc' | 'sol';

export default function MoveMint() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [moveName, setMoveName] = useState('');
  const [videoHash, setVideoHash] = useState('');
  const [royalty, setRoyalty] = useState(5);
  const [status, setStatus] = useState('');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [verifiedContent, setVerifiedContent] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('usdc');

  // Store payment req and signed tx for retry verification
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
      if (paymentMethod === 'sol') {
        await mintWithSOL(fromPubkey, phantom);
      } else {
        await mintWithUSDC(fromPubkey, phantom);
      }
    } catch (error: any) {
      console.error('Mint error:', error);
      setStatus(`❌ Error: ${error.message || 'Unknown error'}`);
    }
  }, [authenticated, moveName, videoHash, royalty, user, paymentMethod]);

  const mintWithSOL = async (fromPubkey: PublicKey, phantom: any) => {
    setStatus('Fetching payment requirements...');
    const paymentReq = await fetchX402Requirements();
    const recipientPubkey = new PublicKey(paymentReq.to);

    setStatus(`Preparing SOL transfer (0.0001 SOL) → ${paymentReq.to.slice(0, 6)}...${paymentReq.to.slice(-4)}`);

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

    setStatus('Please sign the 0.0001 SOL payment in your wallet...');
    const signedTx = await phantom.signTransaction(transaction);
    const serializedTx = signedTx.serialize();

    setStatus('Broadcasting SOL payment...');
    const signature = await connection.sendRawTransaction(serializedTx);
    await connection.confirmTransaction(signature);

    setTxSignature(signature);
    paymentReqRef.current = null;
    signedTxBase64Ref.current = null;
    setVerifiedContent({ message: 'SOL payment confirmed on-chain' });
    setStatus(
      `✅ SOL payment confirmed! Move "${moveName}" minted successfully.\nPaid 0.0001 SOL.`
    );
  };

  const mintWithUSDC = async (fromPubkey: PublicKey, phantom: any) => {
    // Step 1: Fetch x402 payment requirements
    setStatus('Fetching payment requirements...');
    const paymentReq = await fetchX402Requirements();
    paymentReqRef.current = paymentReq;

    setStatus(
      `Payment required: ${paymentReq.amount} ${paymentReq.tokenSymbol} → ${paymentReq.to.slice(0, 6)}...${paymentReq.to.slice(-4)}`
    );

    // Step 2: Build USDC SPL token transfer
    setStatus(`Preparing ${paymentReq.tokenSymbol} transfer...`);

    const usdcMint = new PublicKey(paymentReq.token);
    const recipientPubkey = new PublicKey(paymentReq.to);
    const amount = Math.round(parseFloat(paymentReq.amount) * 1_000_000);

    const senderATA = await getAssociatedTokenAddress(usdcMint, fromPubkey);
    const recipientATA = await getAssociatedTokenAddress(usdcMint, recipientPubkey);

    const transaction = new Transaction();

    // Check if recipient ATA exists, create if not
    try {
      await getAccount(connection, recipientATA);
    } catch {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey, recipientATA, recipientPubkey, usdcMint
        )
      );
    }

    // Check sender has USDC
    try {
      const senderAccount = await getAccount(connection, senderATA);
      if (Number(senderAccount.amount) < amount) {
        throw new Error(
          `Insufficient USDC balance. You need ${paymentReq.amount} USDC (devnet).`
        );
      }
    } catch (e: any) {
      if (e.message?.includes('Insufficient')) throw e;
      throw new Error('No USDC token account found. You need devnet USDC in your wallet.');
    }

    transaction.add(
      createTransferInstruction(senderATA, recipientATA, fromPubkey, amount)
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    // Step 3: Sign and capture the signed transaction BEFORE broadcasting
    setStatus(`Please sign the ${paymentReq.amount} ${paymentReq.tokenSymbol} payment in your wallet...`);
    const signedTx = await phantom.signTransaction(transaction);
    const serializedTx = signedTx.serialize();

    // Capture signed tx as base64 for x402 verification
    const signedTxBase64 = Buffer.from(serializedTx).toString('base64');
    signedTxBase64Ref.current = signedTxBase64;

    setStatus('Broadcasting payment...');
    const signature = await connection.sendRawTransaction(serializedTx);
    await connection.confirmTransaction(signature);

    setTxSignature(signature);
    setStatus('Payment sent! Verifying with x402...');

    // Step 4: Verify payment via x402 with proper v2 header
    try {
      const verified = await verifyX402Payment(signedTxBase64, paymentReq);
      setVerifiedContent(verified);
      setStatus(
        `✅ Payment verified! Move "${moveName}" minted successfully.\nPaid ${paymentReq.amount} ${paymentReq.tokenSymbol}.`
      );
    } catch (verifyErr: any) {
      setStatus(
        `⚠️ Payment sent (${signature.slice(0, 8)}...) but verification pending. The x402 endpoint may need a moment to confirm. Try refreshing.`
      );
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

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        {!authenticated ? (
          <div>
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
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 8,
                border: 'none',
                background: isConnecting || !ready
                  ? 'rgba(255,255,255,0.3)'
                  : 'linear-gradient(90deg, #00dbde, #fc00ff)',
                color: '#fff',
                fontWeight: 700,
                cursor: (isConnecting || !ready) ? 'not-allowed' : 'pointer',
              }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet (Privy)'}
            </button>
            {typeof window !== 'undefined' && !(window as any).solana?.isPhantom && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.7, color: '#ffa500' }}>
                ⚠️ Phantom wallet not detected. Please install Phantom extension.
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ opacity: 0.7 }}>
              Connected: {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
            </span>
            <button
              onClick={() => logout()}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'transparent',
                color: '#fff',
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {!authenticated ? (
        <p style={{ textAlign: 'center', opacity: 0.7 }}>
          Connect your wallet to mint a dance move NFT on Solana devnet.
        </p>
      ) : isEthereumWallet ? (
        <div style={{
          padding: '1rem',
          borderRadius: 8,
          background: 'rgba(255, 165, 0, 0.1)',
          border: '1px solid rgba(255, 165, 0, 0.3)',
          marginBottom: '1rem',
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#ffa500' }}>
            ⚠️ Ethereum Wallet Detected
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
            You're connected with an Ethereum wallet ({connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}).
            This dApp requires a <strong>Solana wallet</strong>.
          </p>
          <ol style={{ margin: '0.75rem 0 0 0', paddingLeft: '1.5rem', fontSize: '0.85rem', opacity: 0.9 }}>
            <li>Open your Phantom wallet extension</li>
            <li>Click the network selector at the top</li>
            <li>Switch from "Sepolia" to <strong>"Devnet"</strong> (Solana)</li>
            <li>Disconnect and reconnect here, or refresh the page</li>
          </ol>
          <button
            onClick={() => logout()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: '1px solid rgba(255, 165, 0, 0.5)',
              background: 'rgba(255, 165, 0, 0.2)',
              color: '#ffa500',
              cursor: 'pointer',
            }}
          >
            Disconnect & Switch to Solana
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); mintMove(); }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Move Name
            </label>
            <input
              type="text"
              value={moveName}
              onChange={(e) => setMoveName(e.target.value)}
              placeholder="e.g., 'Asura's Signature Chest Pop'"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Video Hash or Expression
            </label>
            <input
              type="text"
              value={videoHash}
              onChange={(e) => setVideoHash(e.target.value)}
              placeholder="IPFS CID or text description of the move"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Royalty Percentage: {royalty}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={royalty}
              onChange={(e) => setRoyalty(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Payment Method Toggle */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '0.75rem',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
              Payment Method
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('usdc')}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: 6,
                  border: paymentMethod === 'usdc'
                    ? '2px solid #00dbde'
                    : '1px solid rgba(255,255,255,0.2)',
                  background: paymentMethod === 'usdc'
                    ? 'rgba(0, 219, 222, 0.15)'
                    : 'transparent',
                  color: paymentMethod === 'usdc' ? '#00dbde' : '#fff',
                  fontWeight: paymentMethod === 'usdc' ? 700 : 400,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                💵 USDC (x402)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('sol')}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: 6,
                  border: paymentMethod === 'sol'
                    ? '2px solid #9945FF'
                    : '1px solid rgba(255,255,255,0.2)',
                  background: paymentMethod === 'sol'
                    ? 'rgba(153, 69, 255, 0.15)'
                    : 'transparent',
                  color: paymentMethod === 'sol' ? '#9945FF' : '#fff',
                  fontWeight: paymentMethod === 'sol' ? 700 : 400,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                ◎ SOL (Direct)
              </button>
            </div>
            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.75rem', opacity: 0.5 }}>
              {paymentMethod === 'usdc'
                ? 'Pay $0.01 USDC via x402 protocol with on-chain verification'
                : 'Pay 0.0001 SOL directly (devnet) — no x402 verification'}
            </p>
          </div>

          <button
            type="submit"
            disabled={!moveName || !videoHash}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: 8,
              border: 'none',
              background: paymentMethod === 'sol'
                ? 'linear-gradient(90deg, #9945FF, #14F195)'
                : 'linear-gradient(90deg, #00dbde, #fc00ff)',
              color: '#fff',
              fontWeight: 700,
              cursor: (!moveName || !videoHash) ? 'not-allowed' : 'pointer',
              opacity: (!moveName || !videoHash) ? 0.6 : 1,
            }}
          >
            {paymentMethod === 'usdc'
              ? 'Mint Move NFT (x402 · $0.01 USDC)'
              : 'Mint Move NFT (◎ 0.0001 SOL)'}
          </button>
        </form>
      )}

      {status && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          borderRadius: 8,
          background: status.startsWith('✅') ? 'rgba(0,219,222,0.1)' : status.startsWith('❌') ? 'rgba(255,0,0,0.1)' : status.startsWith('⚠️') ? 'rgba(255,165,0,0.1)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${status.startsWith('✅') ? '#00dbde' : status.startsWith('❌') ? '#ff4444' : status.startsWith('⚠️') ? '#ffa500' : 'rgba(255,255,255,0.1)'}`,
        }}>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{status}</p>
          {txSignature && (
            <a
              href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#00dbde', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}
            >
              View payment on Solscan Devnet →
            </a>
          )}
          {txSignature && !verifiedContent && paymentMethod === 'usdc' && (
            <button
              onClick={retryVerification}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: 8,
                border: '1px solid #00dbde',
                background: 'rgba(0, 219, 222, 0.15)',
                color: '#00dbde',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              🔄 Retry Verification
            </button>
          )}
          {verifiedContent && (
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#00dbde' }}>
              {paymentMethod === 'usdc' ? 'x402 verified ✓' : 'On-chain confirmed ✓'}
            </p>
          )}
        </div>
      )}

      {/* Debug Panel — visible after a payment attempt */}
      {signedTxBase64Ref.current && paymentReqRef.current && (
        <details style={{
          marginTop: '1rem',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <summary style={{
            padding: '0.75rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
            opacity: 0.6,
            fontFamily: 'monospace',
          }}>
            🔍 Payment Header Debug
          </summary>
          <div style={{
            padding: '0.75rem',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            maxHeight: '300px',
            overflow: 'auto',
            color: '#aaa',
          }}>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#00dbde' }}>Decoded PAYMENT-SIGNATURE payload:</p>
            {(() => {
              try {
                const url = import.meta.env.VITE_X402_ENDPOINT || 'https://x402.payai.network/api/solana-devnet/paid-content';
                const header = buildX402PaymentHeader(signedTxBase64Ref.current!, paymentReqRef.current!, url);
                const decoded = JSON.parse(atob(header));
                return <pre style={{ margin: 0 }}>{JSON.stringify(decoded, null, 2)}</pre>;
              } catch {
                return <span>Could not decode header</span>;
              }
            })()}
            <p style={{ margin: '1rem 0 0.5rem', fontWeight: 600, color: '#9945FF' }}>Raw 402 requirements:</p>
            <pre style={{ margin: 0 }}>{JSON.stringify(paymentReqRef.current, null, 2)}</pre>
          </div>
        </details>
      )}

      <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', opacity: 0.6 }}>
        {paymentMethod === 'usdc'
          ? 'Minting uses x402 payment protocol — $0.01 USDC on Solana Devnet. You need devnet USDC in your Phantom wallet.'
          : 'Minting with native SOL — 0.0001 SOL on Solana Devnet. Get free devnet SOL from a faucet.'}
      </p>
    </div>
  );
}
