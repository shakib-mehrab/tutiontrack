import jsPDF from 'jspdf';
import { Tuition, ClassLog } from '@/types';

export interface PDFExportOptions {
  tuition: Tuition;
  logs: ClassLog[];
  month?: string;
  studentName?: string;
}

export function generateTuitionPDF({ tuition, logs }: PDFExportOptions) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  pdf.setFontSize(20);
  pdf.setTextColor(40);
  pdf.text('TuitionTrack - Class Report', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;

  // Tuition Details
  pdf.setFontSize(16);
  pdf.setTextColor(0);
  pdf.text('Tuition Details', 20, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(12);
  
  const details = [
    `Subject: ${tuition.subject}`,
    `Student: ${tuition.studentName}`,
    `Teacher: ${tuition.teacherName}`,
    `Schedule: ${tuition.startTime} - ${tuition.endTime}`,
    `Days per Week: ${tuition.daysPerWeek}`,
    `Planned Classes: ${tuition.plannedClassesPerMonth}`,
    `Classes Completed: ${tuition.takenClasses}`,
    `Progress: ${Math.round((tuition.takenClasses / tuition.plannedClassesPerMonth) * 100)}%`,
  ];

  details.forEach(detail => {
    yPosition += 8;
    pdf.text(detail, 25, yPosition);
  });

  yPosition += 20;

  // Filter class dates (increment actions with actual class dates)
  const classDates = logs.filter(log => log.actionType === 'increment' && (log.classDate || log.actionType === 'increment'));
  
  // Sort class dates chronologically
  const sortedClassDates = classDates.sort((a, b) => {
    const dateA = a.classDate || a.date;
    const dateB = b.classDate || b.date;
    
    let timeA = 0, timeB = 0;
    
    try {
      if (dateA && typeof dateA === 'object' && 'seconds' in dateA) {
        timeA = (dateA as { seconds: number }).seconds;
      } else if (dateA && typeof dateA === 'object' && 'toDate' in dateA) {
        timeA = (dateA as { toDate: () => Date }).toDate().getTime() / 1000;
      } else {
        timeA = new Date(dateA as string | number | Date).getTime() / 1000;
      }
      
      if (dateB && typeof dateB === 'object' && 'seconds' in dateB) {
        timeB = (dateB as { seconds: number }).seconds;
      } else if (dateB && typeof dateB === 'object' && 'toDate' in dateB) {
        timeB = (dateB as { toDate: () => Date }).toDate().getTime() / 1000;
      } else {
        timeB = new Date(dateB as string | number | Date).getTime() / 1000;
      }
    } catch {
      return 0;
    }
    
    return timeA - timeB;
  });

  // Complete Class Log Table
  if (sortedClassDates && sortedClassDates.length > 0) {
    pdf.setFontSize(16);
    pdf.text('Complete Class Log', 20, yPosition);
    
    yPosition += 15;
    
    // Enhanced table headers with better formatting
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    
    // Table header background
    pdf.setFillColor(240, 240, 240);
    pdf.rect(20, yPosition - 8, pageWidth - 40, 15, 'F');
    
    // Table headers
    pdf.setTextColor(0);
    pdf.text('Class #', 25, yPosition);
    pdf.text('Date', 65, yPosition);
    pdf.text('Day of Week', 110, yPosition);
    pdf.text('Time Added', 150, yPosition);
    pdf.text('Added By', 180, yPosition);
    
    yPosition += 5;
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Class log rows with enhanced formatting
    pdf.setFont(undefined, 'normal');
    sortedClassDates.forEach((log, index) => {
      // Alternate row background for better readability
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(20, yPosition - 6, pageWidth - 40, 12, 'F');
      }
      
      const classDate = log.classDate || log.date;
      let date, dayOfWeek, timeAdded;
      
      try {
        let classDateTime, addedDateTime;
        
        // Parse class date
        if (classDate && typeof classDate === 'object' && 'seconds' in classDate) {
          classDateTime = new Date((classDate as { seconds: number }).seconds * 1000);
        } else if (classDate && typeof classDate === 'object' && 'toDate' in classDate) {
          classDateTime = (classDate as { toDate: () => Date }).toDate();
        } else {
          classDateTime = new Date(classDate as string | number | Date);
        }
        
        // Parse log creation date
        if (log.date && typeof log.date === 'object' && 'seconds' in log.date) {
          addedDateTime = new Date((log.date as { seconds: number }).seconds * 1000);
        } else if (log.date && typeof log.date === 'object' && 'toDate' in log.date) {
          addedDateTime = (log.date as { toDate: () => Date }).toDate();
        } else {
          addedDateTime = new Date(log.date as string | number | Date);
        }
        
        date = classDateTime.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
        dayOfWeek = classDateTime.toLocaleDateString('en-US', { weekday: 'short' });
        
        timeAdded = addedDateTime.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        date = 'Invalid Date';
        dayOfWeek = 'N/A';
        timeAdded = 'N/A';
      }
      
      pdf.setTextColor(0);
      pdf.text(`${index + 1}`, 25, yPosition);
      pdf.text(date, 65, yPosition);
      pdf.text(dayOfWeek, 110, yPosition);
      pdf.text(timeAdded, 150, yPosition);
      pdf.text(log.addedByName.substring(0, 15), 180, yPosition); // Truncate long names
      
      yPosition += 12;
      
      // Add new page if needed
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 30;
        
        // Repeat headers on new page
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.setFillColor(240, 240, 240);
        pdf.rect(20, yPosition - 8, pageWidth - 40, 15, 'F');
        pdf.setTextColor(0);
        pdf.text('Class #', 25, yPosition);
        pdf.text('Date', 65, yPosition);
        pdf.text('Day of Week', 110, yPosition);
        pdf.text('Time Added', 150, yPosition);
        pdf.text('Added By', 180, yPosition);
        yPosition += 5;
        pdf.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 10;
        pdf.setFont(undefined, 'normal');
      }
    });

    yPosition += 15;
    
    // Summary section
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Summary:', 20, yPosition);
    yPosition += 10;
    
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10);
    pdf.text(`Total Classes Conducted: ${sortedClassDates.length}`, 25, yPosition);
    yPosition += 8;
    
    if (sortedClassDates.length > 0) {
      const firstClass = sortedClassDates[0].classDate || sortedClassDates[0].date;
      const lastClass = sortedClassDates[sortedClassDates.length - 1].classDate || sortedClassDates[sortedClassDates.length - 1].date;
      
      try {
        let firstDate, lastDate;
        
        if (firstClass && typeof firstClass === 'object' && 'seconds' in firstClass) {
          firstDate = new Date((firstClass as { seconds: number }).seconds * 1000).toLocaleDateString();
        } else if (firstClass && typeof firstClass === 'object' && 'toDate' in firstClass) {
          firstDate = (firstClass as { toDate: () => Date }).toDate().toLocaleDateString();
        } else {
          firstDate = new Date(firstClass as string | number | Date).toLocaleDateString();
        }
        
        if (lastClass && typeof lastClass === 'object' && 'seconds' in lastClass) {
          lastDate = new Date((lastClass as { seconds: number }).seconds * 1000).toLocaleDateString();
        } else if (lastClass && typeof lastClass === 'object' && 'toDate' in lastClass) {
          lastDate = (lastClass as { toDate: () => Date }).toDate().toLocaleDateString();
        } else {
          lastDate = new Date(lastClass as string | number | Date).toLocaleDateString();
        }
        
        pdf.text(`Period: ${firstDate} to ${lastDate}`, 25, yPosition);
      } catch {
        // Skip period display if dates are invalid
      }
    }
    
    yPosition += 15;
  }

  // Activity Log Section (all actions including increments, decrements, resets)
  if (logs && logs.length > 0) {
    pdf.setFontSize(16);
    pdf.text('Activity Log', 20, yPosition);
    
    yPosition += 15;
    
    // Table headers with background
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.setFillColor(240, 240, 240);
    pdf.rect(20, yPosition - 8, pageWidth - 40, 15, 'F');
    pdf.setTextColor(0);
    pdf.text('Date', 25, yPosition);
    pdf.text('Action', 80, yPosition);
    pdf.text('Added By', 130, yPosition);
    pdf.text('Notes', 170, yPosition);
    
    yPosition += 5;
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Sort logs by date (most recent first)
    const sortedLogs = [...logs].sort((a, b) => {
      try {
        let timeA = 0, timeB = 0;
        
        if (a.date && typeof a.date === 'object' && 'seconds' in a.date) {
          timeA = (a.date as { seconds: number }).seconds;
        } else if (a.date && typeof a.date === 'object' && 'toDate' in a.date) {
          timeA = (a.date as { toDate: () => Date }).toDate().getTime() / 1000;
        }
        
        if (b.date && typeof b.date === 'object' && 'seconds' in b.date) {
          timeB = (b.date as { seconds: number }).seconds;
        } else if (b.date && typeof b.date === 'object' && 'toDate' in b.date) {
          timeB = (b.date as { toDate: () => Date }).toDate().getTime() / 1000;
        }
        
        return timeB - timeA; // Most recent first
      } catch {
        return 0;
      }
    });

    // Table rows
    pdf.setFont(undefined, 'normal');
    sortedLogs.forEach((log, index) => {
      // Alternate row background
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(20, yPosition - 6, pageWidth - 40, 12, 'F');
      }
      
      let date;
      try {
        if (log.date && typeof log.date === 'object' && 'seconds' in log.date) {
          date = new Date((log.date as { seconds: number }).seconds * 1000).toLocaleDateString();
        } else if (log.date && typeof log.date === 'object' && 'toDate' in log.date) {
          date = (log.date as { toDate: () => Date }).toDate().toLocaleDateString();
        } else {
          date = new Date(log.date as string | number | Date).toLocaleDateString();
        }
      } catch {
        date = 'Invalid Date';
      }
      
      const action = log.actionType === 'increment' ? 'Class Added' : 
                    log.actionType === 'decrement' ? 'Class Removed' : 'Manual Entry';
      
      pdf.setTextColor(0);
      pdf.text(date, 25, yPosition);
      pdf.text(action, 80, yPosition);
      pdf.text(log.addedByName.substring(0, 20), 130, yPosition);
      
      if (log.description) {
        pdf.text(log.description.substring(0, 25), 170, yPosition);
      }
      
      yPosition += 12;
      
      // Add new page if needed
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 30;
        
        // Repeat headers on new page
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.setFillColor(240, 240, 240);
        pdf.rect(20, yPosition - 8, pageWidth - 40, 15, 'F');
        pdf.setTextColor(0);
        pdf.text('Date', 25, yPosition);
        pdf.text('Action', 80, yPosition);
        pdf.text('Added By', 130, yPosition);
        pdf.text('Notes', 170, yPosition);
        yPosition += 5;
        pdf.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 10;
        pdf.setFont(undefined, 'normal');
      }
    });
  }

  // Footer
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(
      `Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pdf.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return pdf;
}

export function downloadTuitionPDF(options: PDFExportOptions) {
  const pdf = generateTuitionPDF(options);
  const fileName = `${options.tuition.subject}_${options.tuition.studentName}_${options.month || 'report'}.pdf`;
  pdf.save(fileName.replace(/\s+/g, '_'));
}
