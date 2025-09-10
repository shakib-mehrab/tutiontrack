import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tuition, ClassLog } from '@/types';

export interface TuitionListener {
  unsubscribe: () => void;
}

export function subscribeToTeacherTuitions(
  teacherId: string, 
  callback: (tuitions: Tuition[]) => void
): TuitionListener {
  const tuitionsRef = collection(db, 'tuitions');
  const q = query(
    tuitionsRef, 
    where('teacherId', '==', teacherId), 
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const tuitions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Tuition));
    
    callback(tuitions);
  }, (error) => {
    console.error('Error listening to tuitions:', error);
  });

  return { unsubscribe };
}

export function subscribeToStudentTuitions(
  studentId: string, 
  callback: (tuitions: Tuition[]) => void
): TuitionListener {
  const tuitionsRef = collection(db, 'tuitions');
  const q = query(
    tuitionsRef, 
    where('studentId', '==', studentId), 
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const tuitions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Tuition));
    
    callback(tuitions);
  }, (error) => {
    console.error('Error listening to tuitions:', error);
  });

  return { unsubscribe };
}

export function subscribeToClassLogs(
  tuitionId: string, 
  callback: (logs: ClassLog[]) => void
): TuitionListener {
  const logsRef = collection(db, 'classLogs');
  const q = query(
    logsRef, 
    where('tuitionId', '==', tuitionId), 
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ClassLog));
    
    callback(logs);
  }, (error) => {
    console.error('Error listening to class logs:', error);
  });

  return { unsubscribe };
}
