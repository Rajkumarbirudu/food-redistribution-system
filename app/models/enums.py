from enum import Enum


class UserRole(str, Enum):
    DONOR = "DONOR"
    INDIVIDUAL_DONOR = "INDIVIDUAL_DONOR"
    NGO = "NGO"
    ADMIN = "ADMIN"
    DELIVERY_PARTNER = "DELIVERY_PARTNER"
    DELIVERY_BOY = "DELIVERY_BOY"


class QuantityUnit(str, Enum):
    KG = "KG"
    GRAM = "GRAM"
    LITER = "LITER"
    ML = "ML"
    PIECE = "PIECE"
    PACKET = "PACKET"
    BOX = "BOX"
    TRAY = "TRAY"
    SERVING = "SERVING"


class FoodUnit(str, Enum):
    KG = "KG"
    GRAM = "GRAM"
    LITER = "LITER"
    ML = "ML"
    PIECE = "PIECE"
    PACKET = "PACKET"
    BOX = "BOX"
    TRAY = "TRAY"
    SERVING = "SERVING"


class PerishabilityRisk(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class StorageRequirement(str, Enum):
    ROOM_TEMPERATURE = "ROOM_TEMPERATURE"
    REFRIGERATED = "REFRIGERATED"
    FROZEN = "FROZEN"


class InventoryStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    DONATED = "DONATED"
    EXPIRED = "EXPIRED"
    REMOVED = "REMOVED"


class ExpiryStatus(str, Enum):
    FRESH = "FRESH"
    EXPIRING_SOON = "EXPIRING_SOON"
    EXPIRED = "EXPIRED"


class DonationStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    CLAIMED = "CLAIMED"
    ASSIGNED = "ASSIGNED"
    IN_TRANSIT = "IN_TRANSIT"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# Used by inventory_service.py
class InventoryTransactionType(str, Enum):
    CREATED = "CREATED"
    UPDATED = "UPDATED"
    DONATED = "DONATED"
    DELETED = "DELETED"


# Kept for compatibility with files importing TransactionType
class TransactionType(str, Enum):
    CREATED = "CREATED"
    UPDATED = "UPDATED"
    DONATED = "DONATED"
    DELETED = "DELETED"