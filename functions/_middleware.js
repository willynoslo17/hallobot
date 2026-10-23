// 301: old hallobot.pages.dev (production host) -> https://hallobot.no
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname === "hallobot.pages.dev" || url.hostname === "www.hallobot.no") {
    url.hostname = "hallobot.no";
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
