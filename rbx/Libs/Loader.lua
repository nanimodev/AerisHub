-->> Modules
local InterfaceUtils = require('../Modules/InterfaceUtils')
local Http = require('../Modules/Http')

-->> Variables
local Loader = {}
Loader.validKeyCallback = nil
Loader.invalidKeyCallback = nil
Loader.selectedGameCallback = nil

-->> Functions
function Loader.Init()

    local players = game:GetService('Players')
    local localPlayer = players.LocalPlayer
    local playerGui = localPlayer.PlayerGui
    local tweenService = game:GetService('TweenService')
    local userInputService = game:GetService('UserInputService')

    local screenGui = InterfaceUtils.Create('ScreenGui', {
        Parent = playerGui,
        ResetOnSpawn = false,
        IgnoreGuiInset = true,
    })

    local window = InterfaceUtils.Create('CanvasGroup', {
        Parent = screenGui,
        AnchorPoint = Vector2.new(0.5, 0.5),
        Size = UDim2.fromOffset(420, 340),
        Position = UDim2.fromScale(0.5, 0.5),
        BackgroundColor3 = Color3.fromRGB(28, 28, 30),
        BorderSizePixel = 0,
    })
    
    local _blurEffect = InterfaceUtils.Create('ImageLabel', {
        Parent = window,
        Size = UDim2.fromScale(1, 1),
        Position = UDim2.fromOffset(0, 0),
        BackgroundTransparency = 1,
        Image = 'rbxassetid://8992230677',
        ImageColor3 = Color3.fromRGB(28, 28, 30),
        ImageTransparency = 0.3,
        ScaleType = Enum.ScaleType.Slice,
        SliceCenter = Rect.new(100, 100, 100, 100),
        ZIndex = 1,
    })

    local closeButton = InterfaceUtils.Create('TextButton', {
        Text = '',
        Parent = window,
        BorderSizePixel = 0,
        AnchorPoint = Vector2.new(0, 0),
        Size = UDim2.fromOffset(14, 14),
        Position = UDim2.fromOffset(12, 12),
        BackgroundColor3 = Color3.fromRGB(255, 95, 86),
    })

    local minimizeButton = InterfaceUtils.Create('TextButton', {
        Text = '',
        Parent = window,
        BorderSizePixel = 0,
        AnchorPoint = Vector2.new(0, 0),
        Size = UDim2.fromOffset(14, 14),
        Position = UDim2.fromOffset(32, 12),
        BackgroundColor3 = Color3.fromRGB(255, 189, 46),
    })

    local keyInput = InterfaceUtils.Create('TextBox', {
        Parent = window,
        TextScaled = false,
        BorderSizePixel = 0,
        Text = '',
        PlaceholderText = 'Enter Your Key Here',
        PlaceholderColor3 = Color3.fromRGB(142, 142, 147),
        TextXAlignment = Enum.TextXAlignment.Center,
        BackgroundColor3 = Color3.fromRGB(44, 44, 46),
        Size = UDim2.fromOffset(300, 44),
        AnchorPoint = Vector2.new(0.5, 0.5),
        Position = UDim2.fromScale(0.5, 0.55),
        TextColor3 = Color3.fromRGB(255, 255, 255),
        Font = Enum.Font.GothamMedium,
        TextSize = 16,
    })
    
    local loginButton = InterfaceUtils.Create('TextButton', {
        Text = 'Login',
        Parent = window,
        TextScaled = false,
        BorderSizePixel = 0,
        BackgroundColor3 = Color3.fromRGB(0, 122, 255),
        Size = UDim2.fromOffset(300, 44),
        AnchorPoint = Vector2.new(0.5, 0.5),
        Position = UDim2.fromScale(0.5, 0.73),
        TextColor3 = Color3.fromRGB(255, 255, 255),
        Font = Enum.Font.GothamMedium,
        TextSize = 17,
        AutoButtonColor = false,
    })
    
    local _buttonGradient = InterfaceUtils.Create('UIGradient', {
        Parent = loginButton,
        Color = ColorSequence.new{
            ColorSequenceKeypoint.new(0, Color3.fromRGB(0, 132, 255)),
            ColorSequenceKeypoint.new(1, Color3.fromRGB(0, 112, 235))
        },
        Rotation = 90,
    })

    local logoIcon = InterfaceUtils.Create('Frame', {
        Parent = window,
        Size = UDim2.fromOffset(60, 60),
        AnchorPoint = Vector2.new(0.5, 0.5),
        Position = UDim2.fromScale(0.5, 0.18),
        BackgroundColor3 = Color3.fromRGB(0, 122, 255),
        BorderSizePixel = 0,
    })
    InterfaceUtils.Corner(logoIcon, 1)
    
    local _logoGradient = InterfaceUtils.Create('UIGradient', {
        Parent = logoIcon,
        Color = ColorSequence.new{
            ColorSequenceKeypoint.new(0, Color3.fromRGB(10, 142, 255)),
            ColorSequenceKeypoint.new(1, Color3.fromRGB(0, 102, 235))
        },
        Rotation = 135,
    })
    
    InterfaceUtils.Create('TextLabel', {
        Text = 'A',
        Parent = logoIcon,
        TextScaled = false,
        TextXAlignment = Enum.TextXAlignment.Center,
        TextYAlignment = Enum.TextYAlignment.Center,
        BackgroundTransparency = 1,
        Size = UDim2.fromScale(1, 1),
        TextColor3 = Color3.fromRGB(255, 255, 255),
        Font = Enum.Font.GothamBold,
        TextSize = 32,
    })
    
    InterfaceUtils.Create('TextLabel', {
        Text = 'Aeris Hub',
        Parent = window,
        TextScaled = false,
        TextXAlignment = Enum.TextXAlignment.Center,
        BackgroundTransparency = 1,
        Size = UDim2.fromOffset(200, 30),
        AnchorPoint = Vector2.new(0.5, 0.5),
        Position = UDim2.fromScale(0.5, 0.33),
        TextColor3 = Color3.fromRGB(255, 255, 255),
        Font = Enum.Font.GothamBold,
        TextSize = 24,
    })
    
    InterfaceUtils.Create('TextLabel', {
        Text = 'Premium Access',
        Parent = window,
        TextScaled = false,
        TextXAlignment = Enum.TextXAlignment.Center,
        BackgroundTransparency = 1,
        Size = UDim2.fromOffset(200, 20),
        AnchorPoint = Vector2.new(0.5, 0.5),
        Position = UDim2.fromScale(0.5, 0.40),
        TextColor3 = Color3.fromRGB(142, 142, 147),
        Font = Enum.Font.Gotham,
        TextSize = 14,
    })

    InterfaceUtils.Corner(loginButton, 0.2)
    InterfaceUtils.Corner(closeButton, 1)
    InterfaceUtils.Corner(minimizeButton, 1)
    InterfaceUtils.Corner(keyInput, 0.2)
    InterfaceUtils.Corner(window, 0.05)
    
    local _shadow = InterfaceUtils.Create('ImageLabel', {
        Parent = screenGui,
        Size = UDim2.fromOffset(440 * 1.15, 360 * 1.15),
        Position = UDim2.new(0.5, 0, 0.5, 4),
        AnchorPoint = Vector2.new(0.5, 0.5),
        BackgroundTransparency = 1,
        Image = 'rbxassetid://235781675',
        ImageColor3 = Color3.fromRGB(0, 0, 0),
        ImageTransparency = 0.5,
        ScaleType = Enum.ScaleType.Stretch,
        ZIndex = 0,
    })
    InterfaceUtils.Corner(_shadow, 0.05)
    
    local inputStroke = InterfaceUtils.Create('UIStroke', {
        Parent = keyInput,
        Color = Color3.fromRGB(58, 58, 60),
        Thickness = 1,
        Transparency = 0.5,
    })
    
    keyInput.Focused:Connect(function()
        inputStroke.Color = Color3.fromRGB(0, 0, 0)
        inputStroke.Thickness = 1
        inputStroke.Transparency = .5
    end)
    
    keyInput.FocusLost:Connect(function()
        inputStroke.Color = Color3.fromRGB(58, 58, 60)
        inputStroke.Thickness = 1
        inputStroke.Transparency = 0.5
        print('checking key')
    end)
    
    loginButton.MouseEnter:Connect(function()
        loginButton.BackgroundColor3 = Color3.fromRGB(10, 132, 255)
    end)
    
    loginButton.MouseLeave:Connect(function()
        loginButton.BackgroundColor3 = Color3.fromRGB(0, 122, 255)
    end)

    loginButton.Activated:Connect(function()
        if #keyInput.Text == 0 then
            InterfaceUtils.Notify('Please enter a key to continue.', 'Error')
            return
        end

        local isValid = Http.ValidateKey(keyInput.Text)

        if isValid then
            if Loader.validKeyCallback then
                Loader.validKeyCallback()
            else
                InterfaceUtils.Notify('Script Error', 'Code 15')
            end
        else
            if Loader.invalidKeyCallback then
                Loader.invalidKeyCallback()
            else
                InterfaceUtils.Notify('Script Error', 'Code 16')
            end
        end
    end)
    
    local dragging = false
    local dragInput
    local dragStart
    local startPos
    local startShadowPos
    
    local function update(input)
        local delta = input.Position - dragStart
        window.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X, startPos.Y.Scale, startPos.Y.Offset + delta.Y)
        _shadow.Position = UDim2.new(startShadowPos.X.Scale, startShadowPos.X.Offset + delta.X, startShadowPos.Y.Scale, startShadowPos.Y.Offset + delta.Y)
    end
    
    window.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            dragging = true
            dragStart = input.Position
            startPos = window.Position
            startShadowPos = _shadow.Position
            
            input.Changed:Connect(function()
                if input.UserInputState == Enum.UserInputState.End then
                    dragging = false
                end
            end)
        end
    end)
    
    window.InputChanged:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch then
            dragInput = input
        end
    end)
    
    userInputService.InputChanged:Connect(function(input)
        if input == dragInput and dragging then
            update(input)
        end
    end)
    
    closeButton.MouseEnter:Connect(function()
        closeButton.BackgroundColor3 = Color3.fromRGB(255, 75, 66)
    end)
    closeButton.MouseLeave:Connect(function()
        closeButton.BackgroundColor3 = Color3.fromRGB(255, 95, 86)
    end)
    
    minimizeButton.MouseEnter:Connect(function()
        minimizeButton.BackgroundColor3 = Color3.fromRGB(255, 179, 36)
    end)
    minimizeButton.MouseLeave:Connect(function()
        minimizeButton.BackgroundColor3 = Color3.fromRGB(255, 189, 46)
    end)
    
    closeButton.Activated:Connect(function()
        local fadeOut = tweenService:Create(window, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
            GroupTransparency = 1,
            Size = UDim2.fromOffset(400, 320)
        })
        fadeOut:Play()
        fadeOut.Completed:Connect(function()
            screenGui:Destroy()
        end)
    end)
    
    local isMinimized = false
    
    minimizeButton.Activated:Connect(function()
        if not isMinimized then
            isMinimized = true
            _blurEffect.Visible = false
            keyInput.Visible = false
            loginButton.Visible = false
            logoIcon.Visible = false
            for _, child in ipairs(window:GetChildren()) do
                if child:IsA('TextLabel') then
                    child.Visible = false
                end
            end
            
            local minimizeTween = tweenService:Create(window, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
                Size = UDim2.fromOffset(80, 40)
            })
            local shadowTween = tweenService:Create(_shadow, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
                Size = UDim2.fromOffset(80 * 1.15, 40 * 1.15),
                ImageTransparency = 1
            })
            minimizeTween:Play()
            shadowTween:Play()
        else

            isMinimized = false
            local restoreTween = tweenService:Create(window, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
                Size = UDim2.fromOffset(420, 340)
            })
            local shadowTween = tweenService:Create(_shadow, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
                Size = UDim2.fromOffset(440 * 1.15, 360 * 1.15),
                ImageTransparency = 0.5
            })
            restoreTween:Play()
            shadowTween:Play()
            
            restoreTween.Completed:Connect(function()
                _blurEffect.Visible = true
                keyInput.Visible = true
                loginButton.Visible = true
                logoIcon.Visible = true
                for _, child in ipairs(window:GetChildren()) do
                    if child:IsA('TextLabel') then
                        child.Visible = true
                    end
                end
            end)
        end
    end)
    
    window.GroupTransparency = 1
    window.Size = UDim2.fromOffset(400, 320)
    
    local fadeIn = tweenService:Create(window, TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
        GroupTransparency = 0,
        Size = UDim2.fromOffset(420, 340)
    })
    fadeIn:Play()
end

function Loader.SelectedGame(callback: (string) -> ())
    Loader.selectedGameCallback = callback
end

function Loader.InvalidKey(callback: () -> ())
    Loader.invalidKeyCallback = callback
end

function Loader.ValidKey(callback: () -> ())
    Loader.validKeyCallback = callback
end


-->> End
return Loader