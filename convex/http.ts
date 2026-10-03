import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { webhook } from "./paypal";
import { receive as bugGithub } from './bugGithub';

const http = httpRouter();
auth.addHttpRoutes(http);
http.route({path: '/paypal/webhook', method: 'POST', handler: webhook});
http.route({path: '/bug/github', method: 'POST', handler: bugGithub});
export default http;
