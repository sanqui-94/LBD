import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import {ServiceAccount} from "firebase-admin";

dotenv.config();

if (!admin.apps.length) {
    try {
        const requiredEnvVars = [
            'FIREBASE_PROJECT_ID',
            'FIREBASE_PRIVATE_KEY',
            'FIREBASE_CLIENT_EMAIL'
        ];

        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`${envVar} environment variable is required`);
            }
        }

        const serviceAccount: ServiceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID!,
            privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        };

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID,
        });

        console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
        console.error('❌ Firebase Admin initialization failed:', error);
        process.exit(1);
    }
}

export default admin;
