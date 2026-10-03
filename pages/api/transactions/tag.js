import { prisma } from '../../../lib/plaid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { validateTransactionTag, canEditTransactionTag, TRANSACTION_TAG_START } from '../../../lib/transaction-tags.mjs';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) return res.status(401).json({ error: 'Not authenticated' });
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    const { transactionId, tag } = req.body || {};
    if (typeof transactionId !== 'string' || !transactionId) return res.status(400).json({ error: 'Transaction ID required' });
    let normalizedTag;
    try {
      normalizedTag = validateTransactionTag(tag);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    const transaction = await prisma.transaction.findFirst({ where: { id: transactionId, userId: user.id } });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    if (!canEditTransactionTag(transaction)) {
      return res.status(400).json({ error: `Transaction tags can only be edited for ${TRANSACTION_TAG_START} onward. Earlier history is preserved.` });
    }
    if (normalizedTag === null && transaction.source !== 'plaid') {
      return res.status(400).json({ error: 'Choose a tag for manual and imported transactions.' });
    }
    const updated = await prisma.transaction.update({ where: { id: transaction.id }, data: { tag: normalizedTag } });
    return res.json({ transaction: updated });
  } catch {
    return res.status(500).json({ error: 'Failed to update transaction tag' });
  }
}
