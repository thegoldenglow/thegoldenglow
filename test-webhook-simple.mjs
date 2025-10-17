// Simple webhook test without dependencies
console.log('Testing webhook setup...\n');

const url = 'https://lambent-pithivier-68ddb6.netlify.app/telegram/set-bot-webhook';

console.log('Open this URL in your browser:');
console.log(url);
console.log('\nOr run this command:');
console.log(`curl -X POST ${url}`);
