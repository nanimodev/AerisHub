-->> Entrypoint: aggregate modules into nested folders table for easy access
local Loader = require('./Libs/Loader')
local InterfaceUtils = require('./Modules/InterfaceUtils')
local GrandPieceOnline = require('./Games/GrandPieceOnline')

-->> Main
Loader.SelectedGame(function(game: string)
    warn('Selected Game: ' .. game)
end)
Loader.InvalidKey(function()
    InterfaceUtils.Notify('Please use the "Get Key" button.', 'Invalid Key')
end)
Loader.ValidKey(function()
    InterfaceUtils.Notify('Welcome to Aeris Hub!', 'Valid Key')
end)

Loader.Init()