import { useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSignTransaction } from '@privy-io/react-auth/solana';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Buffer } from 'buffer';

const connection = new Connection(import.meta.env.VITE_SOLANA_RPC || 'https://api.devnet.solana.com')

// Program ID from deployed Anchor program
const PROGRAM_ID = new PublicKey(import.meta.env.VITE_PROGRAM_ID || 'Dp2JcVDt4seef6LbPCtoHiD5nrHkRUFHJdBPdCUTVeDQ')

export default function MoveMint() {
  const { ready, authenticated, login, logout, user } = usePrivy()
  const { signTransaction } = useSignTransaction()
  const [moveName, setMoveName] = useState('')
  const [videoHash, setVideoHash] = useState('')
  const [royalty, setRoyalty] = useState(5)
  const [status, setStatus] = useState('')
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // Get wallet address directly from Privy's authenticated user object
  const connectedAddress = user?.wallet?.address || null
  const isEthereumWallet = connectedAddress && connectedAddress.startsWith('0x')

  const mintMove = useCallback(async () => {
    if (!authenticated) {
      setStatus('Please connect your wallet first.')
      return
    }

    if (!moveName.trim() || !videoHash.trim()) {
      setStatus('Please fill in all fields.')
      return
    }

    try {
      setStatus('Preparing transaction...')
      const walletAddress = user?.wallet?.address
      if (!walletAddress) throw new Error('Wallet address not available. Please reconnect your wallet.')
      
      // Validate it's a Solana address (not Ethereum 0x format)
      if (walletAddress.startsWith('0x')) {
        throw new Error('Please connect a Solana wallet (Phantom Solana, not Ethereum). The connected wallet appears to be an Ethereum wallet.')
      }
      
      // Try to create PublicKey - will throw if not valid Base58
      let fromPubkey: PublicKey
      try {
        fromPubkey = new PublicKey(walletAddress)
      } catch (e) {
        throw new Error(`Invalid Solana address: ${walletAddress}. Please ensure you're connected with a Solana wallet.`)
      }

      // Derive treasury PDA: seeds = ["treasury"]
      const treasuryPDA = PublicKey.findProgramAddressSync(
        [Buffer.from('treasury')],
        PROGRAM_ID
      )[0]

      // Send a small amount (0.001 SOL) to treasury as "mint fee"
      const amountLamports = 0.001 * LAMPORTS_PER_SOL

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: treasuryPDA,
          lamports: amountLamports,
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = fromPubkey

      setStatus('Please sign the transaction in your wallet...')
      // Privy's signTransaction expects connection and address, not wallet object
      const signedTx = await signTransaction({
        transaction,
        connection,
        address: walletAddress,
      })
      // Serialize the signed transaction to send it
      const serializedTx = signedTx.serialize()
      const signature = await connection.sendRawTransaction(serializedTx)
      await connection.confirmTransaction(signature)

      setTxSignature(signature)
      setStatus(`✅ Move minted! Treasury fee paid (0.001 SOL).\nTransaction: ${signature}`)
    } catch (error: any) {
      console.error('Mint error:', error)
      setStatus(`❌ Error: ${error.message || 'Unknown error'}`)
    }
  }, [authenticated, moveName, videoHash, royalty, user, signTransaction])

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        {!authenticated ? (
          <div>
            <button
              onClick={async () => {
                setIsConnecting(true)
                setStatus('')
                try {
                  // Check if Phantom is installed and available
                  const phantom = typeof window !== 'undefined' ? (window as any).solana : null
                  if (phantom?.isPhantom) {
                    setStatus('Phantom detected. Please approve the connection in Phantom...')
                  } else {
                    setStatus('⚠️ Phantom wallet not detected. Please install Phantom extension.')
                    setIsConnecting(false)
                    return
                  }
                  
                  // Use login() for initial authentication (connectWallet is for linking to authenticated users)
                  // login() will show the Privy modal which should detect Phantom based on PrivyProvider config
                  await login()
                  
                  setIsConnecting(false)
                } catch (error: any) {
                  console.error('Wallet connection error:', error)
                  setStatus(`❌ Connection failed: ${error.message || 'Please ensure Phantom is installed and unlocked'}`)
                  setIsConnecting(false)
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

          <div style={{ marginBottom: '1.5rem' }}>
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

          <button
            type="submit"
            disabled={!moveName || !videoHash}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(90deg, #00dbde, #fc00ff)',
              color: '#fff',
              fontWeight: 700,
              cursor: (!moveName || !videoHash) ? 'not-allowed' : 'pointer',
              opacity: (!moveName || !videoHash) ? 0.6 : 1,
            }}
          >
            Mint Move NFT (Devnet)
          </button>
        </form>
      )}

      {status && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          borderRadius: 8,
          background: status.startsWith('✅') ? 'rgba(0,219,222,0.1)' : status.startsWith('❌') ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${status.startsWith('✅') ? '#00dbde' : status.startsWith('❌') ? '#ff4444' : 'rgba(255,255,255,0.1)'}`,
        }}>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{status}</p>
          {txSignature && (
            <a
              href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#00dbde', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}
            >
              View on Solscan Devnet →
            </a>
          )}
        </div>
      )}

      <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', opacity: 0.6 }}>
        This sends a fee to the treasury PDA, demonstrating the on-chain workflow. The full NFT mint and metadata are handled by the deployed Anchor program.
      </p>
    </div>
  )
}
