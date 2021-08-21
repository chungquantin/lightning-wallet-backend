module.exports = {
	apps: [
		{
			name: 'NeutronPay Wallet',
			script: './src/index.ts',
			instances: '3',
			autorestart: false,
			watch: false,
			max_memory_restart: '1G',
			exec_mode: 'cluster',
			env: {
				NODE_ENV: 'development',
			},
			env_production: {
				NODE_ENV: 'production',
				SESSION_SECRET: 's3ssion-s3cr3t',
				DATABASE_HOST: 'localhost',
				DATABASE_USERNAME: 'postgres',
				DATABASE_PASSWORD: 'Cqt20011101',
				REDIS_HOST: 'localhost',
				REDIS_PORT: 6379,
				REDIS_PASSWORD: '',
				SERVER_URI: 'http://localhost',
				SERVER_ENDPOINT: '',
			},
		},
	],
	deploy: {
		development: {
			user: 'node',
			host: '212.83.163.1',
			ref: 'origin/master',
			repo: 'git@github.com:repo.git',
			path: '/var/www/development',
			'post-deploy':
				'npm install && pm2 reload dev-eco.config.js --env development',
		},
	},
};
