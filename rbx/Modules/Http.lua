-->> RBX Services
local StarterGui = game:GetService('StarterGui')
local HttpService = game:GetService('HttpService')

-->> Variables
local Http = {}
local SERVER_URL = "https://levi-compositorial-george.ngrok-free.dev/validate"

-->> Functionsvai
function Http.ValidateKey(key: string): boolean
    local fullUrl = SERVER_URL .. "?key=" .. key
    
    local success, response = pcall(function()
        return game:HttpGet(fullUrl)
    end)

    if not success then
        StarterGui:SetCore("SendNotification", {
            Title = "Error",
            Text = "No connection to server.",
            Duration = 5
        })
        return false
    end

    print("Resposta:", response) -- Debug

    local ok, data = pcall(HttpService.JSONDecode, HttpService, response)
    if not ok or not data.valid then
        return false
    end

    return data.valid == true
end

-->> End
return Http