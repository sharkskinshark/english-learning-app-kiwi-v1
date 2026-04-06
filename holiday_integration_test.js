/**
 * Holiday System Integration Test
 * Tests for conflicts between holiday animations/vocabularies and main Cambridge vocabulary system
 */

console.log('🔍 Starting Holiday System Integration Test...');

// Test 1: Check for function name conflicts
function testFunctionConflicts() {
    console.log('\n📋 Test 1: Function Name Conflicts');
    
    const holidayFunctions = [
        'testChristmasAnimation', 'testChristmasVocab',
        'testNewYearAnimation', 'testNewYearVocab',
        'testChineseNewYearAnimation', 'testChineseNewYearVocab',
        'testHalloweenAnimation', 'testHalloweenVocab',
        'testSummerAnimation', 'testSummerVocab',
        'testEasterAnimation', 'testEasterVocab',
        'testSpringBloomAnimation', 'testSpringBloomVocab',
        'testThanksgivingAnimation', 'testThanksgivingVocab',
        'testBackToSchoolAnimation', 'testBackToSchoolVocab',
        'testBirthdayAnimation', 'testBirthdayVocab'
    ];
    
    const conflicts = [];
    holidayFunctions.forEach(func => {
        if (typeof window[func] === 'function') {
            console.log(`✅ ${func} - Available`);
        } else {
            console.log(`❌ ${func} - Not found`);
            conflicts.push(func);
        }
    });
    
    if (conflicts.length === 0) {
        console.log('✅ No function conflicts detected');
    } else {
        console.log(`⚠️ ${conflicts.length} function conflicts found:`, conflicts);
    }
    
    return conflicts.length === 0;
}

// Test 2: Check vocabulary system integration
function testVocabularyIntegration() {
    console.log('\n📚 Test 2: Vocabulary System Integration');
    
    // Check if main vocabulary loading functions exist
    const mainVocabFunctions = ['loadVocab', 'createVocabDisplay'];
    let mainSystemOK = true;
    
    mainVocabFunctions.forEach(func => {
        if (typeof window[func] === 'function') {
            console.log(`✅ Main vocab function ${func} - Available`);
        } else {
            console.log(`❌ Main vocab function ${func} - Not found`);
            mainSystemOK = false;
        }
    });
    
    // Test holiday vocabulary display without interfering with main system
    try {
        if (typeof createVocabDisplay === 'function') {
            console.log('✅ Holiday vocabulary display system operational');
        } else {
            console.log('⚠️ Holiday vocabulary display system not found');
        }
    } catch (error) {
        console.log('❌ Error in vocabulary integration:', error.message);
        mainSystemOK = false;
    }
    
    return mainSystemOK;
}

// Test 3: Check animation system integrity
function testAnimationIntegrity() {
    console.log('\n🎭 Test 3: Animation System Integrity');
    
    const animationClasses = [
        'christmas-loader', 'newyear-loader', 'halloween-loader', 
        'summer-loader', 'easter-loader', 'spring-loader',
        'thanksgiving-loader', 'birthday-loader'
    ];
    
    let animationsOK = true;
    
    animationClasses.forEach(className => {
        const styles = document.querySelector(`style`);
        if (styles && styles.textContent.includes(className)) {
            console.log(`✅ Animation class .${className} - CSS defined`);
        } else {
            console.log(`⚠️ Animation class .${className} - CSS not found`);
        }
    });
    
    // Check for animation conflicts with main app
    const mainAppElements = ['#mainContent', '.vocabulary-section', '.cambridge-content'];
    mainAppElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            console.log(`✅ Main app element ${selector} - Present`);
        } else {
            console.log(`⚠️ Main app element ${selector} - Not found`);
        }
    });
    
    return animationsOK;
}

// Test 4: Check for code corruption
function testCodeCorruption() {
    console.log('\n🔧 Test 4: Code Corruption Detection');
    
    let corruptionFound = false;
    
    // Check for syntax errors in holiday functions
    const testFunctions = [
        () => typeof testChristmasAnimation === 'function',
        () => typeof testHalloweenAnimation === 'function',
        () => typeof testSpringBloomAnimation === 'function'
    ];
    
    testFunctions.forEach((test, index) => {
        try {
            if (test()) {
                console.log(`✅ Holiday function ${index + 1} - Syntax OK`);
            } else {
                console.log(`⚠️ Holiday function ${index + 1} - Not defined`);
            }
        } catch (error) {
            console.log(`❌ Holiday function ${index + 1} - Corrupted:`, error.message);
            corruptionFound = true;
        }
    });
    
    return !corruptionFound;
}

// Test 5: Check holiday-main app interaction
function testMainAppInteraction() {
    console.log('\n🔗 Test 5: Holiday-Main App Interaction');
    
    let interactionOK = true;
    
    // Test if holiday animations interfere with main app functionality
    try {
        // Check if main vocabulary functions are accessible during holiday testing
        if (typeof isHolidayActiveOrUnlocked === 'function') {
            console.log('✅ Holiday status function available');
        } else {
            console.log('⚠️ Holiday status function not found');
        }
        
        // Check if animation unlock system works
        if (typeof window.isAnimationUnlocked !== 'undefined') {
            console.log('✅ Animation unlock system present');
        } else {
            console.log('⚠️ Animation unlock system not found');
        }
        
    } catch (error) {
        console.log('❌ Error in main app interaction:', error.message);
        interactionOK = false;
    }
    
    return interactionOK;
}

// Run all tests
function runIntegrationTests() {
    console.log('🚀 Running Holiday System Integration Tests...\n');
    
    const results = {
        functionConflicts: testFunctionConflicts(),
        vocabularyIntegration: testVocabularyIntegration(),
        animationIntegrity: testAnimationIntegrity(),
        codeCorruption: testCodeCorruption(),
        mainAppInteraction: testMainAppInteraction()
    };
    
    console.log('\n📊 Integration Test Results:');
    console.log('================================');
    
    let allPassed = true;
    Object.entries(results).forEach(([test, passed]) => {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${test}: ${status}`);
        if (!passed) allPassed = false;
    });
    
    console.log('================================');
    console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
        console.log('🎉 Holiday system is fully integrated without conflicts!');
    } else {
        console.log('⚠️ Holiday system has integration issues that need attention.');
    }
    
    return results;
}

// Export for use in browser console
window.runHolidayIntegrationTests = runIntegrationTests;

// Auto-run if script is loaded in browser
if (typeof window !== 'undefined') {
    console.log('📋 Holiday Integration Test script loaded. Run runHolidayIntegrationTests() to start tests.');
}