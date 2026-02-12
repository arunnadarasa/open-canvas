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
import { Buffer } from 'buffer';

/**
 * Compute Anchor instruction discriminator: sha256("global:<snake_case_name>")[0..8]
 */
async function anchorDiscriminator(name: string): Promise<Buffer> {
  // Convert camelCase to snake_case
  const snakeName = name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  const data = new TextEncoder().encode(`global:${snakeName}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(new Uint8Array(hashBuffer).slice(0, 8));
}

/**
 * Borsh-encode mintSkill args: skillName (string), expression (string), royaltyPercent (u8)
 */
function encodeMintSkillArgs(skillName: string, expression: string, royaltyPercent: number): Buffer {
  const nameBytes = new TextEncoder().encode(skillName);
  const exprBytes = new TextEncoder().encode(expression);
  // 4 bytes len + string bytes for each string, 1 byte for u8
  const buf = Buffer.alloc(4 + nameBytes.length + 4 + exprBytes.length + 1);
  let offset = 0;
  buf.writeUInt32LE(nameBytes.length, offset); offset += 4;
  Buffer.from(nameBytes).copy(buf, offset); offset += nameBytes.length;
  buf.writeUInt32LE(exprBytes.length, offset); offset += 4;
  Buffer.from(exprBytes).copy(buf, offset); offset += exprBytes.length;
  buf.writeUInt8(royaltyPercent, offset);
  return buf;
}

/**
 * Build a mint_skill transaction.
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

  const discriminator = await anchorDiscriminator('mintSkill');
  const args = encodeMintSkillArgs(skillName, expression, royaltyPercent);
  const data = Buffer.concat([discriminator, args]);

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
  const discriminator = await anchorDiscriminator('verifySkill');

  const keys = [
    { pubkey: verifier, isSigner: true, isWritable: true },
    { pubkey: skillPDA, isSigner: false, isWritable: true },
  ];

  const instruction = new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data: discriminator,
  });

  const transaction = new Transaction().add(instruction);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = verifier;

  return transaction;
}
