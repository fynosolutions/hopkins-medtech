const config = {
  poweredByHeader: false,
  async headers() {
    return [{source:'/:path*',headers:[
      {key:'X-Content-Type-Options',value:'nosniff'},
      {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
      {key:'X-Frame-Options',value:'SAMEORIGIN'},
      ...(process.env.SITE_INDEXABLE==='true'?[]:[{key:'X-Robots-Tag',value:'noindex, nofollow'}])
    ]}];
  }
};
export default config;
