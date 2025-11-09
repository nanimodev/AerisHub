-->> Variables
local UI = {}
UI.__index = UI

-->> Functions
function UI.new()
    local self = setmetatable({}, UI)
    return self
end

return UI