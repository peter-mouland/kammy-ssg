/* Location: app/transfers/server/actions/submit-transfer.action.ts */

import { CACHE_KEYS } from '../../../_shared/lib/cache/cache-config';
import { dataCache } from '../../../_shared/lib/cache/data-cache.service';
import { addTransfer } from '../../../_shared/lib/sheets/transfers';
import type { TransferFormData } from '../../types/transfer-form-types';
import type { ProcessedTransferSheetData, TransferSheetData } from '../../types/transfer-types';

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
            // Extract loan fields from form
            onLoanTo: formData.get('onLoanTo') || '',
            onLoanFrom: formData.get('onLoanFrom') || '',
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

        // Prepare sheet data
        const sheetData: ProcessedTransferSheetData = {
            status: null, // Pending approval
            timestamp: new Date(),
            manager: transferData.managerId,
            transferOut: playerOut.web_name,
            codeOut: playerOut.code,
            transferIn: playerIn.web_name,
            codeIn: playerIn.code,
            transferType: mapTransferTypeToSheet(transferData.transferType),
            comment: transferData.comment,
            loanTo: transferData.onLoanTo || '',
            loanFrom: transferData.onLoanFrom || '',
        };

        // Submit to Google Sheets
        await addTransfer(transferData.divisionId, sheetData);
        dataCache.invalidate(CACHE_KEYS.SHEETS.TRANSFERS(transferData.divisionId));

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
        case 'LOAN_END':
            return 'loan end';
        case 'TRADE':
            return 'trade';
        case 'NEW_PLAYER':
            return 'Transfer'; // New players use standard transfer format
        default:
            return 'Transfer';
    }
}
