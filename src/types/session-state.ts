export class SessionState {
    private selectedRemote: string | undefined;

    setSelectedRemote(remote: string) {
        this.selectedRemote = remote;
    }

    getSelectedRemote() {
        return this.selectedRemote;
    }
}