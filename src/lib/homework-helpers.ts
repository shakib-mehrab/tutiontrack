import { Homework } from '@/types';

export async function createHomework(data: {
  tuitionId: string;
  subject: string;
  chapter: string;
  topic: string;
  dueDate: string;
  notes?: string;
}): Promise<{ success: boolean; homework?: Homework; error?: string }> {
  try {
    const response = await fetch('/api/homework', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, homework: result };
    } else {
      return { success: false, error: result.error || 'Failed to create homework' };
    }
  } catch (error) {
    console.error('Error creating homework:', error);
    return { success: false, error: 'Failed to create homework' };
  }
}

export async function updateHomework(
  id: string,
  data: Partial<Homework>
): Promise<{ success: boolean; homework?: Homework; error?: string }> {
  try {
    const response = await fetch(`/api/homework/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, homework: result };
    } else {
      return { success: false, error: result.error || 'Failed to update homework' };
    }
  } catch (error) {
    console.error('Error updating homework:', error);
    return { success: false, error: 'Failed to update homework' };
  }
}

export async function deleteHomework(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/homework/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Failed to delete homework' };
    }
  } catch (error) {
    console.error('Error deleting homework:', error);
    return { success: false, error: 'Failed to delete homework' };
  }
}

export async function markHomeworkComplete(id: string): Promise<{ success: boolean; homework?: Homework; error?: string }> {
  try {
    const response = await fetch(`/api/homework/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, homework: result };
    } else {
      return { success: false, error: result.error || 'Failed to mark homework complete' };
    }
  } catch (error) {
    console.error('Error marking homework complete:', error);
    return { success: false, error: 'Failed to mark homework complete' };
  }
}

export async function getHomeworkForTuition(tuitionId: string): Promise<{ success: boolean; homework?: Homework[]; error?: string }> {
  try {
    const response = await fetch(`/api/homework?tuitionId=${tuitionId}`);
    const result = await response.json();

    if (response.ok && Array.isArray(result)) {
      return { success: true, homework: result };
    } else {
      return { success: false, error: 'Failed to fetch homework' };
    }
  } catch (error) {
    console.error('Error fetching homework:', error);
    return { success: false, error: 'Failed to fetch homework' };
  }
}
