// Holiday Date Trigger Precision Test
// Tests that holidays activate and deactivate on exact dates

const EVENTS = {
    easter: { period: { start: '04-01', end: '04-15' } },
    summer: { period: { start: '06-15', end: '07-15' } },
    backToSchool: { period: { start: '08-15', end: '09-15' } },
    halloween: { period: { start: '10-25', end: '10-31' } },
    christmas: { period: { start: '12-15', end: '12-25' } },
    spring: { period: { start: '03-20', end: '04-20' } },
    thanksgiving: { period: { start: '11-20', end: '11-30' } },
    newyear: { period: { start: '12-26', end: '01-05' } },
    chinesenewyear: { period: { start: '01-15', end: '02-15' } },
    birthday: { period: { start: '09-10', end: '09-10' } }
};

function isHolidayActive(holidayId, testDate) {
    const event = EVENTS[holidayId];
    if (!event || !event.period) return false;
    
    const today = testDate || new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    const startParts = event.period.start.split('-');
    const endParts = event.period.end.split('-');
    
    const startMonth = parseInt(startParts[0]);
    const startDay = parseInt(startParts[1]);
    const endMonth = parseInt(endParts[0]);
    const endDay = parseInt(endParts[1]);
    
    if (startMonth > endMonth) {
        return (currentMonth === startMonth && currentDay >= startDay) ||
               (currentMonth === endMonth && currentDay <= endDay) ||
               (currentMonth > startMonth || currentMonth < endMonth);
    } else {
        if (currentMonth === startMonth && currentMonth === endMonth) {
            return currentDay >= startDay && currentDay <= endDay;
        } else if (currentMonth === startMonth) {
            return currentDay >= startDay;
        } else if (currentMonth === endMonth) {
            return currentDay <= endDay;
        } else {
            return currentMonth > startMonth && currentMonth < endMonth;
        }
    }
}

console.log('🔍 HOLIDAY DATE TRIGGER PRECISION TEST');
console.log('═══════════════════════════════════════\n');

const tests = [
    // Halloween (Oct 25-31)
    { date: new Date(2025, 9, 24), holiday: 'halloween', expected: false, desc: 'Day before Halloween start' },
    { date: new Date(2025, 9, 25), holiday: 'halloween', expected: true, desc: 'Halloween start date (Oct 25)' },
    { date: new Date(2025, 9, 31), holiday: 'halloween', expected: true, desc: 'Halloween end date (Oct 31)' },
    { date: new Date(2025, 10, 1), holiday: 'halloween', expected: false, desc: 'Day after Halloween end' },
    
    // Thanksgiving (Nov 20-30)
    { date: new Date(2025, 10, 19), holiday: 'thanksgiving', expected: false, desc: 'Day before Thanksgiving start' },
    { date: new Date(2025, 10, 20), holiday: 'thanksgiving', expected: true, desc: 'Thanksgiving start (Nov 20)' },
    { date: new Date(2025, 10, 30), holiday: 'thanksgiving', expected: true, desc: 'Thanksgiving end (Nov 30)' },
    { date: new Date(2025, 11, 1), holiday: 'thanksgiving', expected: false, desc: 'Day after Thanksgiving' },
    
    // Christmas (Dec 15-25)
    { date: new Date(2025, 11, 14), holiday: 'christmas', expected: false, desc: 'Day before Christmas start' },
    { date: new Date(2025, 11, 15), holiday: 'christmas', expected: true, desc: 'Christmas start (Dec 15)' },
    { date: new Date(2025, 11, 25), holiday: 'christmas', expected: true, desc: 'Christmas Day (Dec 25)' },
    { date: new Date(2025, 11, 26), holiday: 'christmas', expected: false, desc: 'Day after Christmas' },
    
    // New Year (Dec 26 - Jan 5) - spans year boundary
    { date: new Date(2025, 11, 25), holiday: 'newyear', expected: false, desc: 'Day before New Year start' },
    { date: new Date(2025, 11, 26), holiday: 'newyear', expected: true, desc: 'New Year start (Dec 26)' },
    { date: new Date(2026, 0, 5), holiday: 'newyear', expected: true, desc: 'New Year end (Jan 5)' },
    { date: new Date(2026, 0, 6), holiday: 'newyear', expected: false, desc: 'Day after New Year end' },
    
    // Birthday (Sep 10 only)
    { date: new Date(2025, 8, 9), holiday: 'birthday', expected: false, desc: 'Day before birthday' },
    { date: new Date(2025, 8, 10), holiday: 'birthday', expected: true, desc: 'Birthday (Sep 10)' },
    { date: new Date(2025, 8, 11), holiday: 'birthday', expected: false, desc: 'Day after birthday' },
    
    // Spring Bloom (Mar 20 - Apr 20)
    { date: new Date(2025, 2, 19), holiday: 'spring', expected: false, desc: 'Day before Spring start' },
    { date: new Date(2025, 2, 20), holiday: 'spring', expected: true, desc: 'Spring start (Mar 20)' },
    { date: new Date(2025, 3, 20), holiday: 'spring', expected: true, desc: 'Spring end (Apr 20)' },
    { date: new Date(2025, 3, 21), holiday: 'spring', expected: false, desc: 'Day after Spring end' }
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
    const result = isHolidayActive(test.holiday, test.date);
    const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
    const dateStr = test.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    console.log(`${status} | ${dateStr} | ${test.desc}`);
    if (result === test.expected) passed++;
    else failed++;
});

console.log(`\n═══════════════════════════════════════`);
console.log(`✅ Passed: ${passed}/${tests.length}`);
console.log(`❌ Failed: ${failed}/${tests.length}`);
console.log(`\n${failed === 0 ? '🎉 ALL TESTS PASSED! Date triggers are precise!' : '⚠️ Some tests failed!'}`);

// Test current date
console.log('\n📅 CURRENT DATE TEST (November 2, 2025)');
console.log('═══════════════════════════════════════');
const today = new Date(2025, 10, 2); // Nov 2, 2025
Object.keys(EVENTS).forEach(holiday => {
    const active = isHolidayActive(holiday, today);
    console.log(`${active ? '🟢 ACTIVE' : '⚪ INACTIVE'} | ${holiday}`);
});
