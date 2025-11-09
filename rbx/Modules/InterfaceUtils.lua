-->> RBX Services
local StarterGui = game:GetService('StarterGui')

-->> Modules
local InstanceUtils = require('./InstanceUtils')

-->> Variables
local InterfaceUtils = {}

-->> Functions
function InterfaceUtils.Create(className: string, properties: {[string]: any}?)
    local instance = Instance.new(className)
    instance.Name = InstanceUtils.GetRandomName(16)
    if properties then
        for property, value in pairs(properties) do
            instance[property] = value
        end
    end
    return instance
end

function InterfaceUtils.Corner(parent: GuiObject, radius: number)
    local corner = InterfaceUtils.Create('UICorner', {
        Parent = parent,
        CornerRadius = UDim.new(radius, 0),
    })
    return corner
end

function InterfaceUtils.Notify(text: string, title: string?)
    StarterGui:SetCore('SendNotification', {
        Title = title or 'Notification',
        Text = text,
    })
end
-->> End
return InterfaceUtils