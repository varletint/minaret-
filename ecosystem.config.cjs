module.exports = {
  apps: [
    {
      name: "minaret-api",
      script: "dist/index.js",
      cwd: "/home/deploy/minaret-backend",
      instances: "max", // Use all CPU cores
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_file: "/home/deploy/minaret-backend/.env",
      error_file: "/home/deploy/logs/minaret-error.log",
      out_file: "/home/deploy/logs/minaret-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Health check
      health_check_interval: 30000,
    },
  ],
};
