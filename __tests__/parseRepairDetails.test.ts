import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock console to capture logs during tests
const originalConsoleLog = console.log;
let consoleLogs: string[] = [];

beforeEach(() => {
    consoleLogs = [];
    console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
    };
});

afterEach(() => {
    console.log = originalConsoleLog;
});

// Copy the function from the route file for testing
function parseRepairDetailsFromCardName(cardName: string) {
    // Clean the card name by removing invisible characters and normalizing whitespace
    const cleanedName = cardName.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').replace(/\s+/g, ' ').trim();
    
    console.log('Parsing card name:', cardName);
    console.log('Cleaned card name:', cleanedName);
    
    // Pattern: "Repair 2725 - Ke Chau", "Repair #61 : David Knoernschild", "Repair 45 John Doe"
    // First capture the repair number, then require at least one non-digit separator, then capture names
    const match = cleanedName.match(/Repair\s*#?(\d+)\s*[^\w\d]*\s*([A-Za-z]+)(?:\s+([A-Za-z]+))?/i);
    
    console.log('Regex match result:', match);
    
    if (match) {
        const result = {
            repairNumber: match[1],
            customerFirstName: match[2] || '',
            customerLastName: match[3] || ''
        };
        console.log('Parsed result:', result);
        return result;
    }
    console.log('No match found');
    return null;
}

describe('parseRepairDetailsFromCardName', () => {
    describe('Standard formats', () => {
        it('should parse "Repair #61 : David Knoernschild"', () => {
            const result = parseRepairDetailsFromCardName('Repair #61 : David Knoernschild');
            expect(result).toEqual({
                repairNumber: '61',
                customerFirstName: 'David',
                customerLastName: 'Knoernschild'
            });
        });

        it('should parse "Repair 2725 - Ke Chau"', () => {
            const result = parseRepairDetailsFromCardName('Repair 2725 - Ke Chau');
            expect(result).toEqual({
                repairNumber: '2725',
                customerFirstName: 'Ke',
                customerLastName: 'Chau'
            });
        });

        it('should parse "Repair 45 John Doe"', () => {
            const result = parseRepairDetailsFromCardName('Repair 45 John Doe');
            expect(result).toEqual({
                repairNumber: '45',
                customerFirstName: 'John',
                customerLastName: 'Doe'
            });
        });


        it('should parse "Repair 63: Brian Johnson"', () => {
            const result = parseRepairDetailsFromCardName('Repair 63: Brian Johnson');
            expect(result).toEqual({
                repairNumber: '63',
                customerFirstName: 'Brian',
                customerLastName: 'Johnson'
            });
        });

    });

    describe('With invisible characters', () => {
        it('should parse "Repair #61⁠ : David⁠ Knoernschild" with zero-width spaces', () => {
            const result = parseRepairDetailsFromCardName('Repair #61⁠ : David⁠ Knoernschild');
            expect(result).toEqual({
                repairNumber: '61',
                customerFirstName: 'David',
                customerLastName: 'Knoernschild'
            });
        });

        it('should handle multiple invisible characters', () => {
            const cardName = 'Repair\u200B #\u200C123\uFEFF :\u200D Jane\u200B Smith';
            const result = parseRepairDetailsFromCardName(cardName);
            expect(result).toEqual({
                repairNumber: '123',
                customerFirstName: 'Jane',
                customerLastName: 'Smith'
            });
        });
    });

    describe('Various separators', () => {
        it('should parse with pipe separator', () => {
            const result = parseRepairDetailsFromCardName('Repair #123 | Jane Smith');
            expect(result).toEqual({
                repairNumber: '123',
                customerFirstName: 'Jane',
                customerLastName: 'Smith'
            });
        });

        it('should parse with tilde separator', () => {
            const result = parseRepairDetailsFromCardName('Repair 456 ~ Bob Wilson');
            expect(result).toEqual({
                repairNumber: '456',
                customerFirstName: 'Bob',
                customerLastName: 'Wilson'
            });
        });

        it('should parse with multiple special characters', () => {
            const result = parseRepairDetailsFromCardName('Repair #789 ::: Alice Cooper');
            expect(result).toEqual({
                repairNumber: '789',
                customerFirstName: 'Alice',
                customerLastName: 'Cooper'
            });
        });

        it('should parse with mixed separators', () => {
            const result = parseRepairDetailsFromCardName('Repair 999 -:| Mary Johnson');
            expect(result).toEqual({
                repairNumber: '999',
                customerFirstName: 'Mary',
                customerLastName: 'Johnson'
            });
        });
    });

    describe('Optional components', () => {
        it('should parse without # symbol', () => {
            const result = parseRepairDetailsFromCardName('Repair 100 Sarah Connor');
            expect(result).toEqual({
                repairNumber: '100',
                customerFirstName: 'Sarah',
                customerLastName: 'Connor'
            });
        });

        it('should parse with only first name', () => {
            const result = parseRepairDetailsFromCardName('Repair #200 : Madonna');
            expect(result).toEqual({
                repairNumber: '200',
                customerFirstName: 'Madonna',
                customerLastName: ''
            });
        });

        it('should parse with no separators', () => {
            const result = parseRepairDetailsFromCardName('Repair 300 Prince Rogers');
            expect(result).toEqual({
                repairNumber: '300',
                customerFirstName: 'Prince',
                customerLastName: 'Rogers'
            });
        });
    });

    describe('Case insensitivity', () => {
        it('should parse lowercase "repair"', () => {
            const result = parseRepairDetailsFromCardName('repair #400 : elvis presley');
            expect(result).toEqual({
                repairNumber: '400',
                customerFirstName: 'elvis',
                customerLastName: 'presley'
            });
        });

        it('should parse mixed case', () => {
            const result = parseRepairDetailsFromCardName('RePaIr #500 - MiChAeL jAcKsOn');
            expect(result).toEqual({
                repairNumber: '500',
                customerFirstName: 'MiChAeL',
                customerLastName: 'jAcKsOn'
            });
        });
    });

    describe('Edge cases and invalid inputs', () => {
        it('should return null for invalid format', () => {
            const result = parseRepairDetailsFromCardName('Invalid card name');
            expect(result).toBeNull();
        });

        it('should return null for empty string', () => {
            const result = parseRepairDetailsFromCardName('');
            expect(result).toBeNull();
        });

        it('should return null for repair without number', () => {
            const result = parseRepairDetailsFromCardName('Repair John Doe');
            expect(result).toBeNull();
        });

        it('should return null for repair without names', () => {
            const result = parseRepairDetailsFromCardName('Repair #123');
            expect(result).toBeNull();
        });

        it('should handle extra whitespace', () => {
            const result = parseRepairDetailsFromCardName('  Repair   #600   :   Frank   Sinatra  ');
            expect(result).toEqual({
                repairNumber: '600',
                customerFirstName: 'Frank',
                customerLastName: 'Sinatra'
            });
        });

        it('should handle very long repair numbers', () => {
            const result = parseRepairDetailsFromCardName('Repair #123456789 - Long Number');
            expect(result).toEqual({
                repairNumber: '123456789',
                customerFirstName: 'Long',
                customerLastName: 'Number'
            });
        });
    });

    describe('Real-world examples', () => {
        it('should parse the original failing case', () => {
            const result = parseRepairDetailsFromCardName('Repair #61 : David Knoernschild');
            expect(result).toEqual({
                repairNumber: '61',
                customerFirstName: 'David',
                customerLastName: 'Knoernschild'
            });
        });

        it('should parse dash separator example', () => {
            const result = parseRepairDetailsFromCardName('Repair 2725 - Ke Chau');
            expect(result).toEqual({
                repairNumber: '2725',
                customerFirstName: 'Ke',
                customerLastName: 'Chau'
            });
        });
    });

    describe('Console logging', () => {
        it('should log parsing steps', () => {
            parseRepairDetailsFromCardName('Repair #123 : Test User');
            
            expect(consoleLogs).toContain('Parsing card name: Repair #123 : Test User');
            expect(consoleLogs).toContain('Cleaned card name: Repair #123 : Test User');
            expect(consoleLogs.some(log => log.includes('Regex match result:'))).toBe(true);
            expect(consoleLogs.some(log => log.includes('Parsed result:'))).toBe(true);
        });

        it('should log when no match is found', () => {
            parseRepairDetailsFromCardName('Invalid format');
            
            expect(consoleLogs).toContain('No match found');
        });
    });
});
