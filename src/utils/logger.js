/**
 * Faz 9 — Logger: winston tabanlı günlük log rotasyonu
 * logs/bot-YYYY-MM-DD.log dosyasına yazar.
 * winston-daily-rotate-file kurulu değilse sadece konsola yazar.
 */

let winston;
try { winston = require('winston'); } catch { winston = null; }

let DailyRotateFile;
try { DailyRotateFile = require('winston-daily-rotate-file'); } catch { DailyRotateFile = null; }

const fs = require('fs');
const path = require('path');

// logs/ klasörünü oluştur
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

function buildLogger() {
    if (!winston) {
        // Fallback: sadece konsol
        const levels = ['error', 'warn', 'info', 'debug'];
        const obj = {};
        levels.forEach(l => {
            obj[l] = (...args) => console[l === 'error' ? 'error' : l === 'warn' ? 'warn' : 'log'](`[${l.toUpperCase()}]`, ...args);
        });
        return obj;
    }

    const transports = [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ];

    if (DailyRotateFile) {
        transports.push(new DailyRotateFile({
            filename: path.join(logsDir, 'bot-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }));
    } else {
        // Basit dosya logger
        transports.push(new winston.transports.File({
            filename: path.join(logsDir, 'bot.log'),
            maxsize: 5_242_880,
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }));
    }

    return winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        transports
    });
}

const logger = buildLogger();

module.exports = logger;
