import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTransfers, saveTransfers } from '@kammy/helpers.spreadsheet';
import formatTransfers from '@kammy/helpers.spreadsheet/src/lib/formatTransfers';

import Transfers from '../models/transfers';

const getTransfersQueryKey = (divisionId) => ['transfers', divisionId];

export const useTransfersSheet = ({ divisionId }) =>
    useQuery({
        queryKey: getTransfersQueryKey(divisionId),
        queryFn: ({ queryKey }) => fetchTransfers(queryKey[1]),
        select: (transfers) => new Transfers(transfers).all,
    });

export const useMutateTransfersSheet = ({ divisionId }) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: saveTransfers,
        onMutate: async ({ data }) => {
            // const queryKey = getTransfersQueryKey(divisionId);
            // console.log({ data });
            // queryClient.setQueryData(queryKey, (old) => [...old, ...formatTransfers(data, divisionId)]);
        },
        onSuccess: async (data) => {
            const queryKey = getTransfersQueryKey(divisionId);
            await queryClient.cancelQueries(queryKey);
            queryClient.setQueryData(queryKey, (old) => [...old, ...formatTransfers(data, divisionId)]);
        },
    });
};
