import {cronJobs, makeFunctionReference} from 'convex/server';
const crons = cronJobs();
crons.interval('Reconcile PayPal subscriptions', {hours: 6}, makeFunctionReference<'action'>('paypal:reconcile'), {});
export default crons;
