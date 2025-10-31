'use client';

import React, { useState } from 'react';
import { runComprehensiveDimensionTests, generateTestReport } from '@/lib/dimension-tests';
import type { DimensionTestResult } from '@/lib/dimension-tests';

export default function DimensionTestRunner() {
  const [testResults, setTestResults] = useState<DimensionTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testReport, setTestReport] = useState<string>('');

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setTestReport('');
    
    try {
      console.log('Starting dimension tests...');
      
      // Mock process function for testing (since we need to provide one)
      const mockProcessImageFn = async (imageUrl: string, edits: any) => {
        // This is a simplified mock - in real tests we'd use the actual API
        return { imageUrl: imageUrl, error: undefined };
      };
      
      const results = await runComprehensiveDimensionTests(mockProcessImageFn);
      setTestResults(results);
      
      const report = generateTestReport(results);
      setTestReport(report);
      
      console.log('Dimension tests completed:', results);
    } catch (error) {
      console.error('Error running dimension tests:', error);
      setTestReport(`Error running tests: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Dimension Test Runner</h2>
      
      <button
        onClick={runTests}
        disabled={isRunning}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
      >
        {isRunning ? 'Running Tests...' : 'Run Dimension Tests'}
      </button>

      {testReport && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Test Report</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
            {testReport}
          </pre>
        </div>
      )}

      {testResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Detailed Results</h3>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className={`p-4 rounded border ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">
                    {result.testName} - {result.passed ? '✅ PASSED' : '❌ FAILED'}
                  </h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Original:</strong> {result.originalDimensions.width} × {result.originalDimensions.height}
                  </div>
                  <div>
                    <strong>Expected:</strong> {result.expectedDimensions.width} × {result.expectedDimensions.height}
                  </div>
                  <div>
                    <strong>Actual:</strong> {result.actualDimensions.width} × {result.actualDimensions.height}
                  </div>
                  <div>
                    <strong>Rotation:</strong> {result.rotationAngle}°
                  </div>
                </div>
                
                {result.error && (
                  <div className="mt-2 text-red-600 text-sm">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}