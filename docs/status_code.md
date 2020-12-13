The return value of `getActivities` is a list of object. Each object have a `status` property, which indicates the state of the result.

| Status-Code | Description                                                              |
| ----------- | ------------------------------------------------------------------------ |
| 0           | All pages can parsed each with one or more activities                    |
| 1           | Unable to identifiy an implementation with the content of the first page |
| 2           | More than one implementation was found for the first page                |
| 3           | Critical unforeseen error during parsing, abort.                         |
| 4           | Unable to parse given file type                                          |
| 5           | No activities found for a valid document                                 |
| 6           | One or more of the activities could not be parsed yet, the issue is known|

