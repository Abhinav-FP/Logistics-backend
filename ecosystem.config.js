module.exports = {
    apps: [
      {
        watch: true,
        name: 'Logistics-backend',
        script: './App.js',
        cwd: '/home/ubuntu/Logistics-backend',
        env: {
          NODE_ENV: 'production',
        },
      },
    ],
  };