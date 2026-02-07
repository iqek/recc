from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any

@dataclass
class MediaItem:
    """Unified format for all media types"""
    
    id: str  # "anime_1", "game_11037"...
    title: str
    media_type: str
    
    # Content features
    genres: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    description: Optional[str] = None
    
    # Metadata
    year: Optional[int] = None
    rating: Optional[float] = None 
    
    # type-specific stuff
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self):
        """Convert to dictionary"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict):
        """Create from dictionary"""
        return cls(**data)
    
    def get_text_for_similarity(self):
        """Get combined text for ML similarity calculations"""
        parts = [
            self.title,
            self.description or "",
            " ".join(self.genres),
            " ".join(self.tags)
        ]
        return " ".join(parts).lower()