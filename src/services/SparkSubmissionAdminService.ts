import { FirebaseService } from './ServiceFactory';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export interface SparkSubmission {
    id: string;
    userId: string;
    timestamp: number;
    sparkName: string;
    description: string;
    customer: string;
    customerPayment: string;
    creationPayment: string;
    email: string;
    status: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'built';
    viewedByAdmin?: boolean;
    viewedByAdminAt?: any;
}

export class SparkSubmissionAdminService {
    /**
     * Get all spark submissions for admin review
     */
    static async getAllSubmissions(): Promise<SparkSubmission[]> {
        try {
            const db = (FirebaseService as any).db;
            if (!db) return [];

            const q = query(
                collection(db, 'sparkSubmissions'),
                orderBy('timestamp', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SparkSubmission[];
        } catch (error) {
            console.error('Error getting spark submissions:', error);
            return [];
        }
    }

    /**
     * Get unread spark submissions count
     */
    static async getUnreadSubmissionsCount(): Promise<number> {
        try {
            const submissions = await this.getAllSubmissions();
            return submissions.filter(s => s.viewedByAdmin !== true).length;
        } catch (error) {
            console.error('Error getting unread submissions count:', error);
            return 0;
        }
    }

    /**
     * Mark a submission as viewed by admin
     */
    static async markSubmissionAsViewed(submissionId: string): Promise<void> {
        try {
            const db = (FirebaseService as any).db;
            if (!db) return;

            const submissionRef = doc(db, 'sparkSubmissions', submissionId);
            await updateDoc(submissionRef, {
                viewedByAdmin: true,
                viewedByAdminAt: new Date()
            });
            console.log('✅ Spark submission marked as viewed:', submissionId);
        } catch (error) {
            console.error('Error marking submission as viewed:', error);
            throw error;
        }
    }

    /**
     * Start a real-time listener for new spark submissions
     */
    static startSubmissionsListener(onNewSubmission: (submission: SparkSubmission) => void): () => void {
        try {
            const db = (FirebaseService as any).db;
            if (!db) return () => { };

            const q = query(
                collection(db, 'sparkSubmissions'),
                where('viewedByAdmin', '==', false) // This might not catch existing undfined ones easily in Firestore query
            );

            // Better listener: listen to all and filter in JS if needed, or use a better query
            const unsubscribe = onSnapshot(collection(db, 'sparkSubmissions'), (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const data = change.doc.data() as SparkSubmission;
                        if (data.viewedByAdmin !== true) {
                            onNewSubmission({ ...data, id: change.doc.id });
                        }
                    }
                });
            });

            return unsubscribe;
        } catch (error) {
            console.error('Error starting submissions listener:', error);
            return () => { };
        }
    }
}
