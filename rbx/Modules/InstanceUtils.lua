-->> Variables
local InstanceUtils = {}
local chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

-->> Functions
function InstanceUtils.GetRandomName(length: number): string
    local name = ''
    for i = 1, length do
        local randIndex = math.random(1, #chars)
        name = name .. chars:sub(randIndex, randIndex)
    end
    return name
end

-->> End
return InstanceUtils