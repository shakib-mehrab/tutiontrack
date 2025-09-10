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

  // Class Logs Section
  if (logs && logs.length > 0) {
    pdf.setFontSize(16);
    pdf.text('Class Log', 20, yPosition);
    
    yPosition += 15;
    
    // Table headers
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('Date', 25, yPosition);
    pdf.text('Action', 80, yPosition);
    pdf.text('Added By', 130, yPosition);
    
    yPosition += 5;
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Table rows
    pdf.setFont(undefined, 'normal');
    logs.forEach(log => {
      const date = new Date(log.date.seconds * 1000).toLocaleDateString();
      const action = log.actionType === 'increment' ? 'Class Added' : 
                    log.actionType === 'decrement' ? 'Class Removed' : 'Manual Entry';
      
      pdf.text(date, 25, yPosition);
      pdf.text(action, 80, yPosition);
      pdf.text(log.addedByName, 130, yPosition);
      
      if (log.description) {
        yPosition += 6;
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text(`Note: ${log.description}`, 25, yPosition);
        pdf.setFontSize(10);
        pdf.setTextColor(0);
      }
      
      yPosition += 10;
      
      // Add new page if needed
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
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
