"use node";
import { Resend } from 'resend';
import { v } from 'convex/values';
import { makeFunctionReference as ref } from 'convex/server';
import { internalAction } from './_generated/server';

export const notify = internalAction({
  args: { id: v.id('supportTickets'), attempt: v.number() },
  handler: async (ctx, { id, attempt }) => {
    const ticket = await ctx.runQuery(ref<'query', any>('support:getForNotification'), { id });
    if (!ticket || ticket.notification === 'sent') return;
    const key = process.env.SUPPORT_RESEND_KEY || process.env.AUTH_RESEND_KEY;
    const from = process.env.SUPPORT_EMAIL_FROM || process.env.AUTH_EMAIL_FROM;
    const to = process.env.SUPPORT_EMAIL_TO;
    if (!key || !from || !to) {
      await ctx.runMutation(ref<'mutation', any>('support:markNotification'), { id, notification: 'unconfigured' });
      return;
    }
    try {
      const { error } = await new Resend(key).emails.send({
        from, to: to.split(',').map(email => email.trim()).filter(Boolean), replyTo: ticket.email,
        subject: `[Savage Master ${ticket.reference}] ${ticket.title.replace(/[\r\n]/g, ' ')}`,
        text: `${ticket.kind === 'bug' ? 'Bug report' : 'Support request'}\nTicket: ${ticket.reference}\nReply email: ${ticket.email}\n\n${ticket.body}\n\n${ticket.diagnostics ? 'Player-approved error details:\n' + ticket.diagnostics : 'No automatic error details attached.'}`,
      }, { idempotencyKey: `support-${id}` });
      if (error) throw new Error('Delivery failed');
      await ctx.runMutation(ref<'mutation', any>('support:markNotification'), { id, notification: 'sent' });
    } catch {
      await ctx.runMutation(ref<'mutation', any>('support:markNotification'), { id, notification: attempt < 2 ? 'pending' : 'failed' });
      if (attempt < 2) await ctx.scheduler.runAfter((attempt + 1) * 60000, ref<'action', any>('supportEmail:notify'), { id, attempt: attempt + 1 });
    }
  },
});
