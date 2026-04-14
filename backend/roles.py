from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends, status
from auth import db, get_current_user, User, RoleChecker

router = APIRouter(prefix="/roles", tags=["admin"])

class Permission(BaseModel):
    name: str = Field(..., description="Unique name of the permission, e.g., 'user_create'")
    description: Optional[str] = Field(None, description="Description of what the permission allows")

class Role(BaseModel):
    name: str = Field(..., description="Unique name of the role, e.g., 'Administrator'")
    permissions: List[str] = Field(default_factory=list, description="List of permission names associated with this role")

class RoleCreate(BaseModel):
    name: str
    permissions: List[str] = []

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    permissions: Optional[List[str]] = None

class PermissionCreate(BaseModel):
    name: str
    description: Optional[str] = None

@router.get("/permissions", response_model=List[Permission])
async def list_permissions(_ = Depends(RoleChecker(["Admin"]))):
    perms = await db.permissions.find().to_list(length=100)
    return [Permission(**{k: v for k, v in p.items() if k != "_id"}) for p in perms]

@router.get("/", response_model=List[Role])
async def list_roles(_ = Depends(RoleChecker(["Admin"]))):
    roles = await db.roles.find().to_list(length=100)
    return [Role(**{k: v for k, v in r.items() if k != "_id"}) for r in roles]

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_role(req: RoleCreate, _ = Depends(RoleChecker(["Admin"]))):
    if await db.roles.find_one({"name": req.name}):
        raise HTTPException(status_code=400, detail="Role already exists")
    
    # Verify all provided permissions exist
    perms = await db.permissions.find({"name": {"$in": req.permissions}}).to_list(length=len(req.permissions))
    if len(perms) != len(req.permissions):
        raise HTTPException(status_code=400, detail="One or more permissions do not exist")
        
    await db.roles.insert_one(req.dict())
    return {"success": True, "message": f"Role {req.name} created"}

@router.patch("/{name}")
async def update_role(name: str, req: RoleUpdate, _ = Depends(RoleChecker(["Admin"]))):
    update_data = {}
    if req.name is not None: update_data["name"] = req.name
    if req.permissions is not None:
        perms = await db.permissions.find({"name": {"$in": req.permissions}}).to_list(length=len(req.permissions))
        if len(perms) != len(req.permissions):
            raise HTTPException(status_code=400, detail="One or more permissions do not exist")
        update_data["permissions"] = req.permissions
        
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
        
    result = await db.roles.update_one({"name": name}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"success": True, "message": f"Role {name} updated"}

@router.delete("/{name}")
async def delete_role(name: str, _ = Depends(RoleChecker(["Admin"]))):
    # Prevent deleting roles that are assigned to users
    user_count = await db.users.count_documents({"role": name})
    if user_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete role {name} because it is assigned to {user_count} users")
        
    result = await db.roles.delete_one({"name": name})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"success": True, "message": f"Role {name} deleted"}
