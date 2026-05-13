const permissions = {
    // Admin Actions
    APPROVE_KYC: ['super_admin'],
    VIEW_ALL_SHOPS: ['super_admin'],
    MANAGE_GLOBAL_SETTINGS: ['super_admin'],
    
    // Shop Operations
    VIEW_REPORTS: ['super_admin', 'shop_owner', 'manager'],
    EXPORT_REPORTS: ['super_admin', 'shop_owner', 'manager'],
    MANAGE_INVENTORY: ['shop_owner', 'manager'],
    DELETE_PRODUCT: ['shop_owner'],
    PROCESS_SALE: ['shop_owner', 'manager', 'cashier'],
    PROCESS_RETURN: ['shop_owner', 'manager', 'cashier'],
    MANAGE_SHIFT: ['shop_owner', 'manager', 'cashier'],
    MANAGE_STAFF: ['shop_owner'],
    VIEW_AUDIT_LOG: ['super_admin', 'shop_owner']
};

const hasPermission = (userRole, action) => {
    if (!permissions[action]) return false;
    return permissions[action].includes(userRole);
};

module.exports = { permissions, hasPermission };
