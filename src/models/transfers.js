// eslint-disable-next-line max-classes-per-file
class Transfer {
    warnings = [];
    constructor(transfer) {
        this.codeIn = parseInt(transfer.codeIn, 10);
        this.codeOut = parseInt(transfer.codeOut, 10);
        this.timestamp = new Date(transfer.timestamp);
        this.type = transfer.type;
        this.managerId = transfer.managerId;
        this.status = transfer.status;
        this.isValid = transfer.status === 'Y';
        this.isPending = transfer.status === 'TBC';
        this.isFailed = transfer.status === 'E';
        this.comment = transfer.comment;
        this.statusAsEmoji = this.getStatusAsEmoji();
    }

    addWarnings(warnings) {
        this.warnings = warnings;
    }

    getStatusAsEmoji() {
        switch (true) {
            case this.isPending:
                return '&#129300;'; // thinking
            case this.isFailed:
                return '&#129324;'; // angry
            case this.isValid:
                return '&#129303;'; // happy
            default:
                return '';
        }
    }
}

export default class Transfers {
    all = [];
    constructor(transfers) {
        transfers.forEach((transfer) => {
            const t = new Transfer(transfer);
            this.all.push(t);
        });
    }
}
