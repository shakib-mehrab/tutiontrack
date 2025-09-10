import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  deleteDoc,
  addDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tuition, ClassLog, User } from '@/types';

export async function createTuition(tuitionData: Omit<Tuition, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; tuitionId?: string }> {
  try {
    const tuitionsRef = collection(db, 'tuitions');
    const docRef = doc(tuitionsRef);
    
    const newTuition: Tuition = {
      ...tuitionData,
      id: docRef.id,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    };

    await setDoc(docRef, newTuition);

    // Update both teacher and student's linkedTuitions
    await updateUserTuitions(tuitionData.teacherId, docRef.id, 'add');
    await updateUserTuitions(tuitionData.studentId, docRef.id, 'add');

    return { success: true, message: 'Tuition created successfully', tuitionId: docRef.id };
  } catch (error) {
    console.error('Error creating tuition:', error);
    return { success: false, message: 'Failed to create tuition' };
  }
}

export async function getTuitionsByTeacher(teacherId: string): Promise<Tuition[]> {
  try {
    const tuitionsRef = collection(db, 'tuitions');
    const q = query(tuitionsRef, where('teacherId', '==', teacherId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as Tuition);
  } catch (error) {
    console.error('Error fetching teacher tuitions:', error);
    return [];
  }
}

export async function getTuitionsByStudent(studentId: string): Promise<Tuition[]> {
  try {
    const tuitionsRef = collection(db, 'tuitions');
    const q = query(tuitionsRef, where('studentId', '==', studentId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as Tuition);
  } catch (error) {
    console.error('Error fetching student tuitions:', error);
    return [];
  }
}

export async function updateClassCount(
  tuitionId: string, 
  action: 'increment' | 'decrement', 
  userId: string, 
  userName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const tuitionRef = doc(db, 'tuitions', tuitionId);
    const tuitionDoc = await getDoc(tuitionRef);
    
    if (!tuitionDoc.exists()) {
      return { success: false, message: 'Tuition not found' };
    }

    const tuition = tuitionDoc.data() as Tuition;
    let newCount = tuition.takenClasses;

    if (action === 'increment') {
      newCount += 1;
    } else if (action === 'decrement' && newCount > 0) {
      newCount -= 1;
    } else if (action === 'decrement' && newCount <= 0) {
      return { success: false, message: 'Cannot decrement below 0' };
    }

    // Update tuition
    await updateDoc(tuitionRef, {
      takenClasses: newCount,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    // Log the action
    await addClassLog({
      tuitionId,
      actionType: action,
      addedBy: userId,
      addedByName: userName,
    });

    return { success: true, message: `Class count ${action}ed successfully` };
  } catch (error) {
    console.error('Error updating class count:', error);
    return { success: false, message: 'Failed to update class count' };
  }
}

export async function addClassLog(logData: Omit<ClassLog, 'id' | 'date' | 'createdAt'>): Promise<void> {
  try {
    const logsRef = collection(db, 'classLogs');
    await addDoc(logsRef, {
      ...logData,
      date: Timestamp.fromDate(new Date()),
      createdAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error adding class log:', error);
    throw error;
  }
}

export async function getClassLogs(tuitionId: string): Promise<ClassLog[]> {
  try {
    const logsRef = collection(db, 'classLogs');
    const q = query(logsRef, where('tuitionId', '==', tuitionId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ClassLog));
  } catch (error) {
    console.error('Error fetching class logs:', error);
    return [];
  }
}

export async function resetClassCount(tuitionId: string, userId: string, userName: string): Promise<{ success: boolean; message: string }> {
  try {
    const tuitionRef = doc(db, 'tuitions', tuitionId);
    
    // Update to new month/year and reset count
    const currentDate = new Date();
    const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    await updateDoc(tuitionRef, {
      takenClasses: 0,
      currentMonthYear,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    // Log the reset
    await addClassLog({
      tuitionId,
      actionType: 'manual',
      addedBy: userId,
      addedByName: userName,
      description: 'Monthly reset',
    });

    return { success: true, message: 'Class count reset successfully' };
  } catch (error) {
    console.error('Error resetting class count:', error);
    return { success: false, message: 'Failed to reset class count' };
  }
}

export async function deleteTuition(tuitionId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Get tuition to find teacher and student IDs
    const tuitionRef = doc(db, 'tuitions', tuitionId);
    const tuitionDoc = await getDoc(tuitionRef);
    
    if (!tuitionDoc.exists()) {
      return { success: false, message: 'Tuition not found' };
    }

    const tuition = tuitionDoc.data() as Tuition;

    // Remove tuition reference from users
    await updateUserTuitions(tuition.teacherId, tuitionId, 'remove');
    await updateUserTuitions(tuition.studentId, tuitionId, 'remove');

    // Delete tuition
    await deleteDoc(tuitionRef);

    return { success: true, message: 'Tuition deleted successfully' };
  } catch (error) {
    console.error('Error deleting tuition:', error);
    return { success: false, message: 'Failed to delete tuition' };
  }
}

async function updateUserTuitions(userId: string, tuitionId: string, action: 'add' | 'remove'): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return;

    const user = userDoc.data() as User;
    let linkedTuitions = user.linkedTuitions || [];

    if (action === 'add' && !linkedTuitions.includes(tuitionId)) {
      linkedTuitions.push(tuitionId);
    } else if (action === 'remove') {
      linkedTuitions = linkedTuitions.filter(id => id !== tuitionId);
    }

    await updateDoc(userRef, { linkedTuitions });
  } catch (error) {
    console.error('Error updating user tuitions:', error);
  }
}
