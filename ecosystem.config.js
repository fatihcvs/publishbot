module.exports = {
    apps: [
        {
            name: 'publisher-bot',
            script: 'src/main.js',
            cwd: './',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',
            env: {
                NODE_ENV: 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            },
            // Log dosyaları
            log_file: './logs/combined.log',
            out_file: './logs/out.log',
            error_file: './logs/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            // Hata durumunda yeniden başlatma
            min_uptime: '10s',
            max_restarts: 10,
            restart_delay: 4000,
            // Graceful shutdown
            kill_timeout: 5000,
            listen_timeout: 8000
        }
    ]
};
