/* Location: app/transfers/server/actions/transfer-sheet.service.ts */

import type { DivisionId } from '../../../teams/types/team-types';
import type { TransferSheetData } from '../../types/transfer-types';

/**
 * Submit a transfer to the appropriate Google Sheet
 */
export async function submitTransferToSheet(divisionId: DivisionId, transferData: TransferSheetData): Promise<void> {
    try {
        console.log(`📝 Submitting transfer to ${divisionId}-transfers sheet`);

        // Get the Google Sheets service
        const { GoogleSheetsService } = await import('../../../_shared/lib/sheets/google-sheets-service');
        const sheetsService = new GoogleSheetsService();

        // Construct sheet name based on division
        const sheetName = `${divisionId}-transfers`;

        // Prepare row data in the expected column order
        const rowData = [
            transferData.Status || '', // Status (Y/N/empty)
            transferData.Timestamp.toISOString(), // Timestamp
            transferData.Manager, // Manager
            transferData['Transfer Out'], // Transfer Out player name
            transferData['Code Out'], // Transfer Out player code
            transferData['Transfer In'], // Transfer In player name
            transferData['Code In'], // Transfer In player code
            transferData['Transfer Type'], // Transfer Type
            transferData.Comment || '', // Comment
        ];

        // Append the transfer to the sheet
        await sheetsService.appendRow(sheetName, rowData);

        console.log(`✅ Transfer submitted successfully to ${sheetName}`);
    } catch (error) {
        console.error('❌ Failed to submit transfer to sheet:', error);
        throw new Error(
            `Failed to submit transfer to Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}
