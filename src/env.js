var env = {
  //site_url:'http://localhost:8500/api',
};

switch(document.location.host){
  case 'staging.nametag_designer.com':
    env = {
      env: 'staging',
      site_url:'/api',
    };
    break;
  case 'www.nametag-designer.com':
  case 'nametag-designer.com':
    env = {
      env: 'production',
      site_url:'/api',
    };
    break;
  case 'localhost:3000':
  default:
    env = {
      env: 'dev',
      site_url:'http://localhost:8500/api',
    };
    break;
}



export default env;
