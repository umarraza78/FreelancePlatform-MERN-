const defaultTemplates = [
    {
        name: 'FREELANCER_VERIFICATION_APPROVED',
        subject: 'Verification Approved',
        body: 'Congratulations! Your freelancer verification has been approved at {{level}} level.',
        type: 'both',
        variables: [
            {
                name: 'level',
                description: 'Verification level (Basic, Verified, Premium)'
            }
        ]
    },
    {
        name: 'FREELANCER_VERIFICATION_REJECTED',
        subject: 'Verification Rejected',
        body: 'Your freelancer verification request has been rejected. Please contact support for more information.',
        type: 'both',
        variables: []
    },
    {
        name: 'PROJECT_ASSIGNED',
        subject: 'Project Assigned',
        body: 'You have been assigned to the project "{{projectTitle}}". Please review the project details and start working.',
        type: 'both',
        variables: [
            {
                name: 'projectTitle',
                description: 'Title of the assigned project'
            }
        ]
    },
    {
        name: 'PAYMENT_RECEIVED',
        subject: 'Payment Received',
        body: 'You have received a payment of ${{amount}} for the project "{{projectTitle}}".',
        type: 'both',
        variables: [
            {
                name: 'amount',
                description: 'Payment amount'
            },
            {
                name: 'projectTitle',
                description: 'Title of the project'
            }
        ]
    },
    {
        name: 'PROJECT_COMPLETED',
        subject: 'Project Completed',
        body: 'The project "{{projectTitle}}" has been marked as completed. Please review and provide feedback.',
        type: 'both',
        variables: [
            {
                name: 'projectTitle',
                description: 'Title of the completed project'
            }
        ]
    }
];

module.exports = defaultTemplates; 