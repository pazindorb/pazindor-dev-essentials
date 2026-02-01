This module was created to facilitate the work of developers and macro creators. It provides useful features:
- `PDE.InputDialog` - allow developer to ask user a question and wait for the response. Uses socket to communication between users.
- `PDE.TokenSelector` - allow user to select tokens. Returns selected tokens.
- `PDE.TextEditor` - Prose Mirror based text editor.
- `PDE.TooltipCreator` - allow developer to add automatic tooltips to display items, effects, and journal pages.
- `PDE.utils` - a collection of useful methods that can significantly improve the development process.
- `BaseDialog` - ApplicationV2 dialog with listeners that modify dialog values, can also update database objects (such as an actor or item).


## How to use
All helpers can be called throught `PDE` object. For example:
```
const result = await PDE.TextEditor.open("<p>Text to edit</p>");
```

## InputDialog
![Input Dialog Example](img/input_dialog.jpg)

This dialog allows to send questions to user and await his response. It consists of 3 parameters:
- `inputType` - determines the behavior of the dialogue and what questions it can ask
    -  `info` - a simple dialog that will only display the given information
    -  `drop` - dialog will return the uuids of the documents that were dropped on it
    -  `confirm` - dialog will return a `true` or `false` answer to the question asked
    -  `input` - dialog will return an array of responses to the inputs passed in the `data` object (see below)
- `data` - the object containing the dialog configuration may consist of:
    - `header` - dialog header 
    - `message` - a short description that can tell the user what to do
    - `information` - array containing more detailed information and descriptions
    - `confirmLabel` - button's "confirm" label, default "Confirm"
    - `denyLabel` - button's "deny" label, default "Deny"
    - `hideButtons` - flag hiding buttons.
    - `inputs` - only used by `input` inputType dialog. Array of objects containing single question with space for an answer. An object from this array can consist of the following fields:
        - `type`*(input/select/checkbox)* - depending on the selected type, the input will have different properties
        - `label` - Short description of what the field represents
        - `hint` - Long description of what the field represents
        - `preselected` - If provided, the value will be placed in the field when the dialog is opened. If empty, the field will assume the default value.
        - `options`*(only for select type)* - object in {key: value} format that will be presented as options to choose from
- `options` - an object containing special dialogue behaviors. It may contain fields such as:
    - `toUsers` - If delivered, the dialog will be displayed to specific users. Note: It will only wait for the first response received.
    - `sendToActorOwner` - Its value should be the actor whose owners will be shown the dialogue
    - `allowGM` - If true, accounts with GM permissions will also be counted as users owning the actor

##### Example of use
```
const data = {
  header: "Animal Trivia", 
  message: "Can you answer these questions?", 
  information: [
    "Don't worry, this isn't a test", 
    "Maybe it is tho"
  ],
  inputs: [
    {type: "select", label: "King", hint: "Which animal is king?", options: {lion: "Lion", tiger: "Tiger"}, preselected: "lion"},
    {type: "input", label: "Favorite Animal", hint: "What is your favorite animal?"},
    {type: "checkbox", label: "Chicken", hint: "Is a chicken a dinosaur"}
  ]
}
const options = {
  toUsers: ["Ro95xYO9O3Qa40xT", "2aKVAW5wcIAyChJt"] // Ignore this line if you want to display dialog for triggering user
}
const response = await PDE.InputDialog.open("input", data, options)
console.log(response)
```
And this is example of the received response:
`['tiger', 'Puma', true]`

##### Quick Access Methods
In most cases, you'll need to ask a single question and receive an answer. To accomplish this, InputDialog provides several methods preconfigured to meet your needs:
- `PDE.InputDialog.input(message, options)` 
    - `message` - question you want to ask
    - This method will return value of the `input` field
- `PDE.InputDialog.select(message, selectOptions, options)`
    - `message` - question you want to ask
    - `selectOptions` - object in {key: value} format that will be presented as options to choose from
    - This method will return value of the `select` field
- `PDE.InputDialog.confirm(message, options)`
    - `message` - question you want to ask
    - This method will return `true` or `false` deppending on user choice

***Note** If `InputDialog` is closed by the `x` button or `esc` key, it will return `null`. Remember to check this case when using it.*

## TokenSelector
![Token Selector Example](img/token_selector.jpg)

`TokenSelector` is a simple dialog that allows the user to select tokens from an array and then returns the selected tokens. It consists of 2 parameters:
- `tokens` - an array of tokens from which the user can choose. If it is empty, the dialog assumes that this applies to all tokens on the scene.
- `options` - an object containing special dialogue behaviors. It may contain fields such as:
    - `customMessage` - custom message displayed to the user

##### Example of use
```
const result = await PDE.TokenSelector.create([], {customMessage: "Select targets of your attack"});
console.log(result)
```

## TooltipCreator
![Tooltip Creator Example](img/tooltip.jpg)

`TooltipCreator` can be used in any ApplicationV2. It should be injected in the `_onRender` method.
```
async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.appendChild(PDE.TooltipCreator.getTooltipHtml());
}
```
Use the `PDE.TooltipCreator.showTooltipFor` and `PDE.TooltipCreator.hideTooltip` methods to display and hide the tooltip. If you're looking for an example, take a look at how it was created in `BaseDialog` or `TokenHotbar` in Pazindor's Token Hotbar module. Tooltip automatically recognizes links and allow to jump between objects by clicking on hyperlinks.

If you extend `BaseDialog`, the html element that will display the tooltip will require two elements in the dataset. The first is `data-hover="tooltip"` and the second is `data-uuid="{{object.uuid}}"`. 

##### Example of the html element
```
<img class="item-img" src="{{img}}" data-hover="tooltip" data-uuid="{{item.uuid}}"/>
```

### System specific tooltip
A specific system can extend the tooltip by adding details to it. To do this, add the following `system` object to `PDE`.

```
PDE.system = {
    itemDescriptionPath: "system.description.value",
    enhanceTooltipDescription: enhanceTooltipDescription,
    itemDetails: itemDetails
}
```
- `itemDescriptionPath` - a string that is the path to the item's `description` field.
- `enhanceTooltipDescription` - a function that takes a `description` parameter and returns it after system specific changes have been applied to it.
- `itemDetails` - a function that takes an `item` parameter and returns the html that will be added to the tooltip.

DnD5e is automatically added to the base version of this module.


## BaseDialog
`BaseDialog` can be used to speed up the creation of new dialog boxes. It supports basic operations such as listeners: `mousedown`, `change`, and `drop`. You can override its methods in your implementation if you need to.

`BaseDialog` can be imported into your project as follows:
```
import { BaseDialog } from "/modules/pazindor-dev-essentials/module/pazindor-dev-essentials.mjs";
```
If you are looking for examples of how to use `BaseDialog`, look at `TokenSelector` in this module or `AdventurersRegister` in Pazindor's GM Tools module.
