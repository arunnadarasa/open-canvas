import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_PROGRAM_ID || 'Dp2JcVDt4seef6LbPCtoHiD5nrHkRUFHJdBPdCUTVeDQ'
);

// Devnet USDC mint
export const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

/**
 * IDL for the MoveRegistry Anchor program.
 * Derived from the deployed program at Dp2JcVDt4seef6LbPCtoHiD5nrHkRUFHJdBPdCUTVeDQ
 */
export const MOVE_REGISTRY_IDL = {
  version: '0.1.0',
  name: 'move_registry',
  instructions: [
    {
      name: 'mintSkill',
      accounts: [
        { name: 'creator', isMut: true, isSigner: true },
        { name: 'skillMint', isMut: true, isSigner: false },
        { name: 'treasury', isMut: false, isSigner: false },
        { name: 'skillData', isMut: true, isSigner: false },
        { name: 'systemProgram', isMut: false, isSigner: false },
        { name: 'tokenProgram', isMut: false, isSigner: false },
        { name: 'usdcMint', isMut: true, isSigner: false },
      ],
      args: [
        { name: 'skillName', type: 'string' },
        { name: 'expression', type: 'string' },
        { name: 'royaltyPercent', type: 'u8' },
      ],
    },
    {
      name: 'verifySkill',
      accounts: [
        { name: 'verifier', isMut: true, isSigner: true },
        { name: 'skillData', isMut: true, isSigner: false },
      ],
      args: [],
    },
    {
      name: 'licenseSkill',
      accounts: [
        { name: 'payer', isMut: true, isSigner: true },
        { name: 'paymentSource', isMut: true, isSigner: false },
        { name: 'creatorTokenAccount', isMut: true, isSigner: false },
        { name: 'skillData', isMut: true, isSigner: false },
        { name: 'tokenProgram', isMut: false, isSigner: false },
      ],
      args: [{ name: 'amount', type: 'u64' }],
    },
  ],
  accounts: [
    {
      name: 'SkillAccount',
      type: {
        kind: 'struct',
        fields: [
          { name: 'creator', type: 'pubkey' },
          { name: 'skillName', type: 'string' },
          { name: 'expression', type: 'string' },
          { name: 'timestamp', type: 'i64' },
          { name: 'royaltyPercent', type: 'u8' },
          { name: 'verified', type: 'bool' },
          { name: 'mint', type: 'pubkey' },
          { name: 'treasury', type: 'pubkey' },
        ],
      },
    },
  ],
  events: [
    {
      name: 'SkillMinted',
      fields: [
        { name: 'creator', type: 'pubkey', index: false },
        { name: 'mint', type: 'pubkey', index: false },
        { name: 'skillName', type: 'string', index: false },
      ],
    },
    {
      name: 'SkillVerified',
      fields: [{ name: 'mint', type: 'pubkey', index: false }],
    },
    {
      name: 'SkillLicensed',
      fields: [
        { name: 'mint', type: 'pubkey', index: false },
        { name: 'payer', type: 'pubkey', index: false },
        { name: 'amount', type: 'u64', index: false },
        { name: 'royalty', type: 'u64', index: false },
      ],
    },
  ],
  errors: [
    { code: 6000, name: 'AlreadyVerified', msg: 'Skill already verified' },
    { code: 6001, name: 'NotVerified', msg: 'Skill not verified' },
  ],
  types: [
    {
      name: 'SkillAccount',
      type: {
        kind: 'struct' as const,
        fields: [
          { name: 'creator', type: 'pubkey' },
          { name: 'skillName', type: 'string' },
          { name: 'expression', type: 'string' },
          { name: 'timestamp', type: 'i64' },
          { name: 'royaltyPercent', type: 'u8' },
          { name: 'verified', type: 'bool' },
          { name: 'mint', type: 'pubkey' },
          { name: 'treasury', type: 'pubkey' },
        ],
      },
    },
  ],
} as const;

/**
 * Derive the Treasury PDA: seeds = ["treasury"]
 */
export function getTreasuryPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('treasury')],
    PROGRAM_ID
  );
}

/**
 * Derive the SkillData PDA: seeds = ["skilldata", mintPubkey]
 */
export function getSkillDataPDA(mintPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('skilldata'), mintPubkey.toBytes()],
    PROGRAM_ID
  );
}
