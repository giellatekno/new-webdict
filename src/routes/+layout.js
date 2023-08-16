export const prerender = true;

// Make sure the static adapter always generates /xxx/index.html for the 
// xxx route. We need this because nginx doesn't try xxx.html when the
// url is "/xxx" by default.
export const trailingSlash = "always";
