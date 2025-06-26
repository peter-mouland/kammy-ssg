/* Location: app/transfers/server/actions/submit-transfer.action.ts */

import type { TransferFormData } from '../../types/transfer-form-types';
import type { TransferSheetData } from '../../types/transfer-types';

interface SubmitTransferParams {
    actionType: string;
    formData: URLSearchParams;
}

interface SubmitTransferResult {
    success?: boolean;
    error?: string;
    message?: string;
    data?: any;
}

/**
 * Handle transfer submission actions
 */
export async function handleTransferSubmission({
    actionType,
    formData,
}: SubmitTransferParams): Promise<SubmitTransferResult> {
    try {
        console.log(`🔄 Handling transfer action: ${actionType}`);

        switch (actionType) {
            case 'submitTransfer':
                return await submitTransfer(formData);

            default:
                return {
                    error: `Unknown action type: ${actionType}`,
                };
        }
    } catch (error) {
        console.error(`❌ Transfer action ${actionType} failed:`, error);
        return {
            error: error instanceof Error ? error.message : 'Failed to process transfer action',
        };
    }
}

/**
 * Submit a new transfer to Google Sheets
 */
async function submitTransfer(formData: URLSearchParams): Promise<SubmitTransferResult> {
    try {
        // Extract form data
        const transferData: TransferFormData = {
            divisionId: formData.get('divisionId') as any,
            managerId: formData.get('managerId') as any,
            transferType: formData.get('transferType') as any,
            playerOutCode: Number(formData.get('playerOutCode')),
            playerInCode: Number(formData.get('playerInCode')),
            comment: formData.get('comment') || '',
        };

        // Validate required fields
        if (!transferData.divisionId || !transferData.managerId) {
            return {
                error: 'Division and Manager are required',
            };
        }

        if (!transferData.playerOutCode || !transferData.playerInCode) {
            return {
                error: 'Both players must be selected',
            };
        }

        if (transferData.playerOutCode === transferData.playerInCode) {
            return {
                error: 'Cannot transfer the same player',
            };
        }

        // Get player details for the transfer
        const { getPlayerDetails } = await import('../services/transfer-player-lookup.service');
        const [playerOut, playerIn] = await Promise.all([
            getPlayerDetails(transferData.playerOutCode),
            getPlayerDetails(transferData.playerInCode),
        ]);

        if (!playerOut || !playerIn) {
            return {
                error: 'One or more selected players could not be found',
            };
        }

        // Validate transfer rules
        const { validateTransfer } = await import('../../lib/transfer-validation');
        const validationResult = await validateTransfer(transferData, playerOut, playerIn);

        if (!validationResult.isValid) {
            return {
                error: `Transfer validation failed: ${validationResult.blockingIssues.join(', ')}`,
            };
        }

        // Prepare sheet data
        const sheetData: TransferSheetData = {
            Status: null, // Pending approval
            Timestamp: new Date(),
            Manager: transferData.managerId,
            'Transfer Out': playerOut.web_name,
            'Code Out': playerOut.code,
            'Transfer In': playerIn.web_name,
            'Code In': playerIn.code,
            'Transfer Type': mapTransferTypeToSheet(transferData.transferType),
            Comment: transferData.comment,
        };

        // Submit to Google Sheets
        const { submitTransferToSheet } = await import('./transfer-sheet.service');
        await submitTransferToSheet(transferData.divisionId, sheetData);

        console.log(`✅ Transfer submitted successfully for ${transferData.managerId}`);

        return {
            success: true,
            message: `Transfer submitted successfully! ${playerOut.web_name} → ${playerIn.web_name}`,
            data: {
                transferData,
                playerOut: playerOut.web_name,
                playerIn: playerIn.web_name,
            },
        };
    } catch (error) {
        console.error('❌ Failed to submit transfer:', error);
        return {
            error: error instanceof Error ? error.message : 'Failed to submit transfer',
        };
    }
}

/**
 * Map internal transfer type to sheet format
 */
function mapTransferTypeToSheet(transferType: string): TransferSheetData['Transfer Type'] {
    switch (transferType) {
        case 'TRANSFER':
            return 'Transfer';
        case 'SWAP':
            return 'swap';
        case 'LOAN_START':
            return 'loan start';
        case 'LOAN_FINISH':
            return 'loan finish';
        case 'TRADE':
            return 'trade';
        case 'NEW_PLAYER':
            return 'Transfer'; // New players use standard transfer format
        default:
            return 'Transfer';
    }
}
