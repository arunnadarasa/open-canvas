import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  Keypair,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PROGRAM_ID, USDC_MINT, getTreasuryPDA, getSkillDataPDA } from './anchor-idl';
import { BorshCoder } from '@coral-xyz/anchor';
import { MOVE_REGISTRY_IDL } from './anchor-idl';

// We use BorshCoder to encode instruction data without needing a full Provider
const coder = new BorshCoder(MOVE_REGISTRY_IDL as any);

/**
 * Build a mint_skill transaction.
 * Returns { transaction, mintKeypair } — caller must partially sign with mintKeypair
 * and have the creator sign via Phantom.
 */
export async function buildMintSkillTransaction(
  connection: Connection,
  creator: PublicKey,
  skillName: string,
  expression: string,
  royaltyPercent: number,
): Promise<{ transaction: Transaction; mintKeypair: Keypair; skillPDA: PublicKey; treasuryPDA: PublicKey }> {
  const mintKeypair = Keypair.generate();
  const [treasuryPDA] = getTreasuryPDA();
  const [skillPDA] = getSkillDataPDA(mintKeypair.publicKey);

  const data = coder.instruction.encode('mintSkill', {
    skillName,
    expression,
    royaltyPercent,
  });

  const keys = [
    { pubkey: creator, isSigner: true, isWritable: true },
    { pubkey: mintKeypair.publicKey, isSigner: false, isWritable: true },
    { pubkey: treasuryPDA, isSigner: false, isWritable: false },
    { pubkey: skillPDA, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: USDC_MINT, isSigner: false, isWritable: true },
  ];

  const instruction = new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });

  const transaction = new Transaction().add(instruction);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = creator;

  return { transaction, mintKeypair, skillPDA, treasuryPDA };
}

/**
 * Build a verify_skill transaction.
 */
export async function buildVerifySkillTransaction(
  connection: Connection,
  verifier: PublicKey,
  skillPDA: PublicKey,
): Promise<Transaction> {
  const data = coder.instruction.encode('verifySkill', {});

  const keys = [
    { pubkey: verifier, isSigner: true, isWritable: true },
    { pubkey: skillPDA, isSigner: false, isWritable: true },
  ];

  const instruction = new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });

  const transaction = new Transaction().add(instruction);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = verifier;

  return transaction;
}
