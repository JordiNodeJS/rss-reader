// CSS y CSS Modules declarations
declare module "*.{css,scss,sass}" {
  const content: string;
  export default content;
}
declare module "*.module.{css,scss,sass,pcss}" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
