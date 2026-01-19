module.exports = {
  apps: [
    {
      name: "minaret-api-staging",
      script: "dist/index.js",
      cwd: "/home/deploy/minaret-backend",
      instances: 1, // Single instance for staging
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "staging",
        PORT: 3000,
      },
      env_file: "/home/deploy/minaret-backend/.env",
      error_file: "/home/deploy/logs/minaret-error.log",
      out_file: "/home/deploy/logs/minaret-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
