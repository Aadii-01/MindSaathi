"""
CAPTCHA Image Test Data
Categories: cylinder, traffic signal, road, car
Uses placeholder images from reliable sources for demo purposes.
"""

import random
import uuid
from .json_db import read_db, write_db, add_captcha_session, clear_old_captcha_sessions

# CAPTCHA image database - using placeholder images labeled by category
# In production, these would be actual categorized images
CAPTCHA_IMAGES = {
    "cylinder": [
        "https://images.unsplash.com/photo-1581093588401-71793c5b487c?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1587582423116-ec07293f0395?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop",
    ],
    "traffic signal": [
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1570454072364-7631ad3eb877?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1559564484-e48b3e040ff6?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1560859251-d563a49c5e4a?w=300&h=300&fit=crop",
    ],
    "road": [
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1465447142348-e9952c393450?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    ],
    "car": [
        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1542362567-b07e54358753?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=300&h=300&fit=crop",
    ],
    "tree": [
        "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop",
    ],
    "building": [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=300&h=300&fit=crop",
    ],
}

ALL_CATEGORIES = list(CAPTCHA_IMAGES.keys())


def generate_captcha_challenge():
    """
    Generate a CAPTCHA challenge.
    Returns a grid of 9 images where some match the target category.
    """
    target_category = random.choice(ALL_CATEGORIES)
    
    # Get correct images (2-4 images from target category)
    correct_pool = CAPTCHA_IMAGES[target_category][:]
    random.shuffle(correct_pool)
    num_correct = random.randint(2, 4)
    correct_images = correct_pool[:num_correct]
    
    # Get incorrect images from other categories
    incorrect_categories = [c for c in ALL_CATEGORIES if c != target_category]
    incorrect_images = []
    for cat in incorrect_categories:
        incorrect_images.extend(CAPTCHA_IMAGES[cat])
    random.shuffle(incorrect_images)
    
    # Fill grid: correct + incorrect = 9 total
    num_incorrect = 9 - num_correct
    grid_images = correct_images + incorrect_images[:num_incorrect]
    random.shuffle(grid_images)
    
    # Track correct indices
    correct_indices = []
    for i, img in enumerate(grid_images):
        if img in correct_images:
            correct_indices.append(i)
    
    # Create session
    session_id = str(uuid.uuid4())
    session = {
        "id": session_id,
        "target": target_category,
        "images": grid_images,
        "correct": correct_indices,
        "attempts": 0,
        "solved": False
    }
    
    add_captcha_session(session)
    clear_old_captcha_sessions()
    
    return {
        "id": session_id,
        "target": target_category,
        "images": grid_images,
        "correct": correct_indices  # In production, don't send this to frontend
    }


def verify_captcha(session_id, selected_indices):
    """Verify a CAPTCHA submission."""
    db = read_db()
    for session in db["captcha_sessions"]:
        if session["id"] == session_id:
            session["attempts"] += 1
            
            # Check if selected matches correct (order-independent)
            correct_set = set(session["correct"])
            selected_set = set(selected_indices)
            
            is_correct = (correct_set == selected_set)
            session["solved"] = is_correct
            write_db(db)
            
            return {
                "correct": is_correct,
                "message": "Correct!" if is_correct else "Incorrect. Try again.",
                "attempts": session["attempts"]
            }
    
    return {"correct": False, "message": "Session not found", "attempts": 0}


def get_captcha_session(session_id):
    """Get a CAPTCHA session by ID (without revealing correct answers)."""
    db = read_db()
    for session in db["captcha_sessions"]:
        if session["id"] == session_id:
            return {
                "id": session["id"],
                "target": session["target"],
                "images": session["images"],
            }
    return None

