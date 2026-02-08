/**
 * Simple Job Application Tracker - Google Apps Script
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. Click Deploy > New Deployment
 * 5. Select "Web app" as the type
 * 6. Set "Execute as" to "Me"
 * 7. Set "Who has access" to "Anyone" (or "Anyone with Google account" for more security)
 * 8. Click Deploy and copy the Web App URL
 * 9. Paste the URL in the application-tracker.html file
 */

// Sheet configuration
const SHEET_NAME = 'Applications';
const HEADERS = ['Candidate', 'Company', 'Job Title', 'Who Applied', 'JD Link', 'Job Description', 'Date Applied', 'Resume Summary', 'Status'];

/**
 * Initialize the sheet with headers if needed
 */
function initSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Handle GET requests - return candidates or applications
 */
function doGet(e) {
  const action = e.parameter.action;
  
  let result;
  
  if (action === 'getCandidates') {
    result = getCandidates();
  } else if (action === 'getCompanies') {
    result = getCompanies();
  } else if (action === 'getJobTitles') {
    result = getJobTitles();
  } else if (action === 'getApplications') {
    const candidate = e.parameter.candidate;
    result = getApplications(candidate);
  } else if (action === 'getAllApplications') {
    result = getAllApplications();
  } else {
    result = { error: 'Unknown action' };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests - save new application
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = saveApplication(data);
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get unique list of candidate names
 */
function getCandidates() {
  const sheet = initSheet();
  const data = sheet.getDataRange().getValues();
  
  // Skip header row, get unique candidates
  const candidates = [...new Set(data.slice(1).map(row => row[0]).filter(c => c))];
  
  return { candidates: candidates.sort() };
}

/**
 * Get unique list of companies
 */
function getCompanies() {
  const sheet = initSheet();
  const data = sheet.getDataRange().getValues();
  
  // Skip header row, get unique companies (column index 1)
  const companies = [...new Set(data.slice(1).map(row => row[1]).filter(c => c))];
  
  return { companies: companies.sort() };
}

/**
 * Get unique list of job titles
 */
function getJobTitles() {
  const sheet = initSheet();
  const data = sheet.getDataRange().getValues();
  
  // Skip header row, get unique job titles (column index 2)
  const jobTitles = [...new Set(data.slice(1).map(row => row[2]).filter(c => c))];
  
  return { jobTitles: jobTitles.sort() };
}

/**
 * Get all applications for a specific candidate
 */
function getApplications(candidate) {
  const sheet = initSheet();
  const data = sheet.getDataRange().getValues();
  
  const applications = data.slice(1)
    .filter(row => row[0] === candidate)
    .map(row => ({
      candidate: row[0],
      company: row[1],
      jobTitle: row[2],
      whoApplied: row[3],
      jdLink: row[4],
      jobDescription: row[5],
      dateApplied: row[6],
      resumeSummary: row[7],
      status: row[8] || 'Applied'
    }));
  
  return { applications: applications };
}

/**
 * Get all applications
 */
function getAllApplications() {
  const sheet = initSheet();
  const data = sheet.getDataRange().getValues();
  
  const applications = data.slice(1)
    .filter(row => row[0]) // Skip empty rows
    .map(row => ({
      candidate: row[0],
      company: row[1],
      jobTitle: row[2],
      whoApplied: row[3],
      jdLink: row[4],
      jobDescription: row[5],
      dateApplied: row[6],
      resumeSummary: row[7],
      status: row[8] || 'Applied'
    }));
  
  return { applications: applications };
}

/**
 * Save a new application
 */
function saveApplication(data) {
  const sheet = initSheet();
  
  const row = [
    data.candidate || '',
    data.company || '',
    data.jobTitle || '',
    data.whoApplied || '',
    data.jdLink || '',
    data.jobDescription || '',
    data.dateApplied || new Date().toISOString().split('T')[0],
    data.resumeSummary || '',
    data.status || 'Applied'
  ];
  
  sheet.appendRow(row);
  
  return { success: true, message: 'Application saved successfully' };
}

/**
 * Update application status
 */
function updateStatus(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = initSheet();
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.candidate && 
        allData[i][1] === data.company && 
        allData[i][2] === data.jobTitle) {
      sheet.getRange(i + 1, 7).setValue(data.status);
      return { success: true };
    }
  }
  
  return { error: 'Application not found' };
}

/**
 * Test function - run this to verify the script works
 */
function testScript() {
  initSheet();
  Logger.log('Sheet initialized successfully');
  Logger.log('Candidates: ' + JSON.stringify(getCandidates()));
}
